import { Module } from '@nestjs/common';
import { ShopListingService } from './shop-listing.service';
import { ShopListingController } from './shop-listing.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopListing } from './entities/shop-listing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShopListing])],
  controllers: [ShopListingController],
  providers: [ShopListingService],
})
export class ShopListingModule {}
