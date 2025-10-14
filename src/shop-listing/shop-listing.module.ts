import { Module } from '@nestjs/common';
import { ShopListingService } from './shop-listing.service';
import { ShopListingController } from './shop-listing.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopListing } from './entities/shop-listing.entity';
import { ShopModule } from 'src/shop/shop.module';

@Module({
  imports: [TypeOrmModule.forFeature([ShopListing]), ShopModule],
  controllers: [ShopListingController],
  providers: [ShopListingService],
})
export class ShopListingModule {}
