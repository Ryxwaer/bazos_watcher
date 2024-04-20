import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DataSchema } from './db/data.schema';
import { ConfigSchema } from './db/config.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [ 
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.DB_URI),
    MongooseModule.forFeature([
      { name: 'Data', schema: DataSchema },
      { name: 'Config', schema: ConfigSchema }
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
