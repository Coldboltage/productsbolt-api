import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { UpdateResult } from 'typeorm';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createProductDto);
  }

  @Post('update-website-product-page/:productId')
  updatePageForSite(@Param('productId') productId: string) {
    return this.productService.updatePageForSite(productId);
  }

  @Post('update-website-product-page-by-safe-name/:urlSafeName')
  updatePageForSiteSafeName(@Param('urlSafeName') urlSafeName: string) {
    return this.productService.updatePageForSiteSafeName(urlSafeName);
  }

  @Get()
  findAll(): Promise<Product[]> {
    return this.productService.findAll();
  }

  @Get('find-all-product-only')
  async findAllProducts() {
    return this.productService.findAllProductsOnly();
  }

  @Get('find-all-product-only-by-brand/:brandName')
  async findProductsByBrand(@Param('brandName') brandName: string) {
    return this.productService.findProductsByBrand(brandName);
  }

  @Get('find-all-product-only-by-brand-with-pages/:brandName')
  async findProductsByBrandWithWebPages(@Param('brandName') brandName: string) {
    return this.productService.findProductsByBrandWithWebPages(brandName);
  }

  @Get('find-one-by-product-name/:urlSafeName')
  async findOneByProductName(@Param('urlSafeName') urlSafeName: string) {
    return this.productService.findOneByProductName(urlSafeName);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Product> {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<UpdateResult> {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Product> {
    return this.productService.remove(id);
  }
}
