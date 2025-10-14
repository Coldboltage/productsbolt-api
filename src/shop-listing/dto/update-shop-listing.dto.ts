import { PartialType } from '@nestjs/mapped-types';
import { CreateShopListingDto } from './create-shop-listing.dto';

export class UpdateShopListingDto extends PartialType(CreateShopListingDto) {}
