import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ShopProductService } from './shop-product.service';
import { CreateShopProductDto } from './dto/create-shop-product.dto';
import { UpdateShopProductDto } from './dto/update-shop-product.dto';

@Controller('shop-product')
export class ShopProductController {
  constructor(private readonly shopProductService: ShopProductService) { }

  @Post('scan-shop-product-individual/:id')
  checkForIndividualShopProduct(@Param('id') id: string) {
    return this.shopProductService.checkForIndividualShopProduct(id);
  }

  @Post('manual-update-shops-all-products/')
  manualUpdateAllShopProducts() {
    return this.shopProductService.manualUpdateAllShopProducts();
  }

  @Post('manual-update-shops/:productId')
  manualFindShopsToUpdateProducts(@Param('productId') productId: string) {
    return this.shopProductService.manualFindShopsToUpdateProducts(productId);
  }

  @Post()
  create(@Body() createShopProductDto: CreateShopProductDto) {
    return this.shopProductService.create(createShopProductDto);
  }

  @Get()
  findAll() {
    return this.shopProductService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopProductService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateShopProductDto: UpdateShopProductDto,
  ) {
    return this.shopProductService.update(id, updateShopProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shopProductService.remove(+id);
  }
}
