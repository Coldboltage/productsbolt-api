import { Module } from '@nestjs/common';
import { CandidatePageService } from './candidate-page.service';
import { CandidatePageController } from './candidate-page.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatePage } from './entities/candidate-page.entity';
import { ShopProductModule } from 'src/shop-product/shop-product.module';

@Module({
  imports: [TypeOrmModule.forFeature([CandidatePage]), ShopProductModule],
  controllers: [CandidatePageController],
  providers: [CandidatePageService],
  exports: [CandidatePageService],
})
export class CandidatePageModule {}
