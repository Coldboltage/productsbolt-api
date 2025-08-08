import { Module } from '@nestjs/common';
import { WebpageUtilsService } from './webpage-utils.service';
import { WebpageUtilsController } from './webpage-utils.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Webpage } from '../webpage/entities/webpage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Webpage])],
  controllers: [WebpageUtilsController],
  providers: [WebpageUtilsService],
  exports: [WebpageUtilsService],
})
export class WebpageUtilsModule { }
