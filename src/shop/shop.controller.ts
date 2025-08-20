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
  constructor(private readonly shopService: ShopService) { }

  @Post()
  create(@Body() createShopDto: CreateShopDto) {
    return this.shopService.create(createShopDto);
  }

  @Post('/update-sitemap')
  async updateSitemap() {
    return this.shopService.updateSitemap();
  }

  @Post('/update-sitemap-fast')
  async fastSitemapAll() {
    return this.shopService.fastSitemapAll();
  }

  @Post('/test-shopify-site-collection/:shopId')
  async testShopifySiteCollection(@Param('shopId') shopId: string) {
    return this.shopService.testShopifySiteCollection(shopId);
  }

  @Post('/test-shopify-site-collection-all')
  async testShopifySiteCollectionAllShopify() {
    return this.shopService.testShopifySiteCollectionAllShopify();
  }

  @Post('/update-specific-shop-sitemap/:shopId')
  async manuallyUpdateSitemap(@Param('shopId') shopId: string) {
    return this.shopService.manuallyUpdateSitemap(shopId);
  }

  @Post('/manually-update-sitemap/:shopId')
  async updateSpecificShopSitemap(@Param('shopId') shopId: string) {
    return this.shopService.updateSpecificShopSitemap(shopId);
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
