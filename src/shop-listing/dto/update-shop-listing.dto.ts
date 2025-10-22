import { PartialType } from '@nestjs/mapped-types';
import { CreateShopListingDto } from './create-shop-listing.dto';
import { IsArray } from 'class-validator';
import { ShopListingInterface } from '../entities/shop-listing.entity';

export class UpdateShopListingDto extends PartialType(CreateShopListingDto) {
  @IsArray()
  newListing: ShopListingInterface[];
}
