import { Module } from '@nestjs/common';
import { WebpageUtilsService } from './webpage-utils.service';
import { WebpageUtilsController } from './webpage-utils.controller';

@Module({
  controllers: [WebpageUtilsController],
  providers: [WebpageUtilsService],
})
export class WebpageUtilsModule {}
