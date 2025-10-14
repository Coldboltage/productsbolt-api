import { Module } from '@nestjs/common';
import { ShopListingService } from './shop-listing.service';
import { ShopListingController } from './shop-listing.controller';

@Module({
  controllers: [ShopListingController],
  providers: [ShopListingService],
})
export class ShopListingModule {}
