import { Controller, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { Cron } from '@nestjs/schedule';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) { }

  @Cron('0 */10 * * * *')
  async handleCron() {
    const configEntries = await this.appService.getConfig();

    configEntries.forEach(async configEntry => {
      this.logger.debug(`Scraping ${configEntry.subject}`);
      await this.appService.scrapeAndStore(configEntry);
    });
  }

  @Cron('5 4 * * *', {
    timeZone: 'Europe/Bratislava'
  })
  async RemoveOld() {
    await this.appService.deleteOldRecords();
  }
}
