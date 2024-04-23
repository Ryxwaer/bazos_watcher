import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Data } from './db/data.interface';
import { load } from 'cheerio';
import * as url from 'url';
import * as nodemailer from 'nodemailer';
import { Config } from './db/config.interface';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    @InjectModel('Data') private readonly dataModel: Model<Data>,
    @InjectModel('Config') private readonly configModel: Model<Config>
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async getConfig(): Promise<Config[]> {
    const configEntries = await this.configModel.find({ enabled: true }).exec();
    return configEntries;
  }

  async scrapeAndStore(config: Config): Promise<void> {
    const response = await axios.get(config.url);
    const htmlContent = response.data;

    // remove query from url
    const urlWithoutQuery = config.url.split('?')[0];

    const items = await this.extractItems(htmlContent, config.subject, urlWithoutQuery);

    // check if items has any item that is not present in the database
    const ids = items.map(item => item._id);
    const existingItems = await this.dataModel.find({ _id: { $in: ids } });
    const existingIds = existingItems.map(item => item._id);

    const newItems = items.filter(item => !existingIds.includes(item._id));

    if (newItems.length === 0) {
      this.logger.debug('No new items found');
      return;
    }

    // initial load
    if (!existingIds.length) {
      if (!await this.sendEmail(config, "New agent successfully creted!")) {
        this.logger.error('Email sending failed');
        return;
      }
      const result = await this.dataModel.insertMany(newItems);
      this.logger.debug(`Inserted ${result.length} items`);
      return;
    }

    this.logger.log(`Found ${newItems.length} new items`);
    const message = "Nove inzeraty: \n\n" + newItems.map(item => `[${item.name}] ${item.price}\n${item.link}\n`).join('\n');
    this.logger.debug(message);

    // send message by email to the ryxwaer@gmail.com
    if (!await this.sendEmail(config, message)) {
      this.logger.error('Email sending failed');
      return;
    }

    const result = await this.dataModel.insertMany(newItems);
    this.logger.debug(`Inserted ${result.length} items`);
  }

  async extractItems(htmlContent: string, type: string, urlBase: string): Promise<Data[]> {
    const $ = load(htmlContent);
    const items: Data[] = [];

    $('div.inzeraty').each((index, element) => {
      const linkElement = $(element).find('a');
      const priceElement = $(element).find('div.inzeratycena');

      const link = linkElement.attr('href') || '';
      const name = linkElement.text().trim();
      const price = priceElement.text().trim();

      items.push({
        _id: link.split('/')[2],
        link: url.resolve(urlBase, link),
        name,
        price,
        type: type,
      });
    });

    return items;
  }

  async sendEmail(config: Config, message: string): Promise<boolean> {
    const mailOptions = {
      to: [config.recipients.split(',')],
      from: 'ryxwaer@gmail.com',
      subject: 'Bazos: nove inzeraty - ' + config.subject,
      text: message,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log('Email sent successfully');
      return true;
    } catch (error) {
      this.logger.error(`Email sending failed: ${error}`);
      return false;
    }
  }

  async deleteOldRecords() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
    try {
      const result = await this.dataModel.deleteMany({
        createdAt: { $lt: threeMonthsAgo },
        enabled: false,
      });
      this.logger.log('Deleted records count:', result.deletedCount);
      return result;
    } catch (error) {
      this.logger.error('Error removing old records:', error);
      throw error;
    }
  }
  
}
