import { Body, Controller, Get, Post } from '@nestjs/common';
import { ShopProductBacklistUrlService } from './shop-product-backlist-url.service';
import { CreateShopProductBlacklistUrlDto } from './dto/create.dto';

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

  @Get()
  findAll() {
    return this.shopProductBacklistUrlService.findAll();
  }
}
