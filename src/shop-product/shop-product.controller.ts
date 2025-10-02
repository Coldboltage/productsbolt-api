import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseBoolPipe,
} from '@nestjs/common';
import { ShopProductService } from './shop-product.service';
import { UpdateShopProductDto } from './dto/update-shop-product.dto';
import { ShopProduct } from './entities/shop-product.entity';
import { UpdateResult } from 'typeorm';

@Controller('shop-product')
export class ShopProductController {
  constructor(private readonly shopProductService: ShopProductService) {}

  @Post('scan-shop-product-individual/:id')
  checkForIndividualShopProduct(@Param('id') id: string): Promise<void> {
    return this.shopProductService.checkForIndividualShopProduct(id);
  }

  @Post('manual-update-specific-shop-product-links/:shopProductId/:bypass')
  manualUpdateIndividualShopProductsImmediateLinks(
    @Param('shopProductId') shopProductId: string,
    @Param('bypass', ParseBoolPipe) bypass: boolean,
  ): Promise<void> {
    return this.shopProductService.manualUpdateIndividualShopProductsImmediateLinks(
      shopProductId,
      bypass,
    );
  }

  @Post('manual-update-shops-all-products-links/:scanAll')
  manualUpdateAllShopProductsImmediateLinks(
    @Param('scanAll', ParseBoolPipe) scanAll: boolean,
  ): Promise<void> {
    return this.shopProductService.manualUpdateAllShopProductsImmediateLinks(
      scanAll,
    );
  }

  @Post('manual-update-shops-all-products/')
  manualUpdateAllShopProductsImmediate(): Promise<void> {
    return this.shopProductService.manualUpdateAllShopProductsImmediate();
  }

  @Post('manual-update-shops/:productId')
  manualFindShopsToUpdateProducts(
    @Param('productId') productId: string,
  ): Promise<void> {
    return this.shopProductService.manualFindShopsToUpdateProducts(productId);
  }

  // @Post()
  // create(@Body() createShopProductDto: CreateShopProductDto) {
  //   return this.shopProductService.create(createShopProductDto);
  // }

  @Get()
  findAll(): Promise<ShopProduct[]> {
    return this.shopProductService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ShopProduct> {
    return this.shopProductService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateShopProductDto: UpdateShopProductDto,
  ): Promise<UpdateResult> {
    return this.shopProductService.update(id, updateShopProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<ShopProduct> {
    return this.shopProductService.remove(id);
  }
}
