import { Module } from '@nestjs/common';
import { ScrappedPageService } from './scrapped-page.service';
import { ScrappedPageController } from './scrapped-page.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrappedPage } from './entities/scrapped-page.entity';
import { ShopProductModule } from 'src/shop-product/shop-product.module';

@Module({
  imports: [TypeOrmModule.forFeature([ScrappedPage]), ShopProductModule],
  controllers: [ScrappedPageController],
  providers: [ScrappedPageService],
  exports: [ScrappedPageService],
})
export class ScrappedPageModule {}
