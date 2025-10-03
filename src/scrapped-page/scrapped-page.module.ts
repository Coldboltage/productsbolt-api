import { Module } from '@nestjs/common';
import { ScrappedPageService } from './scrapped-page.service';
import { ScrappedPageController } from './scrapped-page.controller';

@Module({
  controllers: [ScrappedPageController],
  providers: [ScrappedPageService],
})
export class ScrappedPageModule {}
