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
import { Shop } from './entities/shop.entity';
import { UpdateResult } from 'typeorm';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post()
  create(@Body() createShopDto: CreateShopDto): Promise<Shop> {
    return this.shopService.create(createShopDto);
  }

  @Post('/update-sitemap')
  async updateSitemap(): Promise<void> {
    return this.shopService.updateSitemap();
  }

  @Post('/update-sitemap-fast')
  async fastSitemapAll(): Promise<void> {
    return this.shopService.fastSitemapAll();
  }

  @Post('/test-shopify-site-collection/:shopId')
  async testShopifySiteCollection(
    @Param('shopId') shopId: string,
  ): Promise<void> {
    return this.shopService.testShopifySiteCollection(shopId);
  }

  @Post('/test-shopify-site-collection-all')
  async testShopifySiteCollectionAllShopify(): Promise<void> {
    return this.shopService.testShopifySiteCollectionAllShopify();
  }

  @Post('/update-specific-shop-sitemap/:shopId')
  async updateSpecificShopSitemap(
    @Param('shopId') shopId: string,
  ): Promise<void> {
    return this.shopService.updateSpecificShopSitemap(shopId);
  }

  @Post('/manually-update-sitemap/:shopId')
  async manuallyUpdateSitemap(@Param('shopId') shopId: string): Promise<void> {
    return this.shopService.manuallyUpdateSitemap(shopId);
  }

  @Post('/shopify-check')
  async shopifyCheck(): Promise<void> {
    return this.shopService.checkShopsIfShopify();
  }

  @Post('/check-if-shop-is-shopify/:shopId')
  async checkIfShopIsShopify(@Param('shopId') shopId: string): Promise<void> {
    return this.shopService.checkIfShopIsShopify(shopId);
  }

  @Post('cloudflare-test')
  async cloudflareTest(): Promise<void> {
    return this.shopService.cloudflareTest();
  }

  @Post('cloudflare-test/:id')
  async singleCloudflareTest(@Param('id') shopId: string): Promise<void> {
    return this.shopService.singleCloudflareTest(shopId);
  }

  @Get('find-shop/:website')
  findShop(@Param('website') website: string): Promise<Shop> {
    return this.shopService.findShop(website);
  }

  @Get()
  findAll(): Promise<Shop[]> {
    return this.shopService.findAll();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateShopDto: UpdateShopDto,
  ): Promise<UpdateResult> {
    return this.shopService.update(id, updateShopDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Shop> {
    return this.shopService.remove(id);
  }
}
