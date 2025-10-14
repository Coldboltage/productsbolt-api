import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ShopListingService } from './shop-listing.service';
import { CreateShopListingDto } from './dto/create-shop-listing.dto';
import { UpdateShopListingDto } from './dto/update-shop-listing.dto';

@Controller('shop-listing')
export class ShopListingController {
  constructor(private readonly shopListingService: ShopListingService) {}

  @Post()
  create(@Body() createShopListingDto: CreateShopListingDto) {
    return this.shopListingService.create(createShopListingDto);
  }

  @Get()
  findAll() {
    return this.shopListingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopListingService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShopListingDto: UpdateShopListingDto) {
    return this.shopListingService.update(+id, updateShopListingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shopListingService.remove(+id);
  }
}
