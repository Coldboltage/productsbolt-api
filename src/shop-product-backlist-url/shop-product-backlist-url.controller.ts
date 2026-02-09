import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ShopProductBacklistUrlService } from './shop-product-backlist-url.service';
import { CreateShopProductBlacklistUrlDto } from './dto/create.dto';
import { PageType } from './shop-product-blacklist-url.types';

@Controller('shop-product-backlist-url')
export class ShopProductBacklistUrlController {
  constructor(
    private readonly shopProductBacklistUrlService: ShopProductBacklistUrlService,
  ) {}

  @Post('')
  create(
    @Body() createShopProductBlacklistUrlDto: CreateShopProductBlacklistUrlDto,
  ) {
    return this.shopProductBacklistUrlService.create(
      createShopProductBlacklistUrlDto,
    );
  }

  @Post('/:pageId/:pageType')
  createParams(
    @Param('pageId') pageId: string,
    @Param('pageType') pageType: PageType,
  ) {
    return this.shopProductBacklistUrlService.create({
      pageId,
      pageType,
    });
  }

  @Get()
  findAll() {
    return this.shopProductBacklistUrlService.findAll();
  }
}
