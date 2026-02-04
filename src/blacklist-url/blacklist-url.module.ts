import { Module } from '@nestjs/common';
import { BlackListUrlService } from './blacklist-url.service';
import { BlackListUrlController } from './blacklist-url.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlackListUrl } from './entities/blacklist-url.entity';
import { ShopProductModule } from '../shop-product/shop-product.module';
import { WebpageModule } from '../webpage/webpage.module';
import { CandidatePageModule } from 'src/candidate-page/candidate-page.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BlackListUrl]),
    ShopProductModule,
    WebpageModule,
    CandidatePageModule,
  ],
  controllers: [BlackListUrlController],
  providers: [BlackListUrlService],
  exports: [BlackListUrlService],
})
export class BlackListUrlModule {}
