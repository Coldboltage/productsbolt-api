import { Injectable } from '@nestjs/common';
import { CreateShopListingDto } from './dto/create-shop-listing.dto';
import { UpdateShopListingDto } from './dto/update-shop-listing.dto';

@Injectable()
export class ShopListingService {
  create(createShopListingDto: CreateShopListingDto) {
    return 'This action adds a new shopListing';
  }

  findAll() {
    return `This action returns all shopListing`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shopListing`;
  }

  update(id: string, updateShopListingDto: UpdateShopListingDto) {
    return `This action updates a #${id} shopListing`;
  }

  remove(id: number) {
    return `This action removes a #${id} shopListing`;
  }
}
