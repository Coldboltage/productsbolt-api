import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  create(@Body() createShopDto: CreateShopDto) {
    return this.shopService.create(createShopDto);
  }

  @Post('/update-sitemap')
  async updateSitemap() {
    return this.shopService.updateSitemap();
  }

  @Post('/shopify-check')
  async shopifyCheck() {
    return this.shopService.checkShopsIfShopify();
  }

  @Get('find-shop/:website')
  findShop(@Param('website') website: string) {
    return this.shopService.findShop(website);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.shopService.findOne(+id);
  // }

  @Get()
  findAll() {
    return this.shopService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShopDto: UpdateShopDto) {
    return this.shopService.update(id, updateShopDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shopService.remove(+id);
  }
}
