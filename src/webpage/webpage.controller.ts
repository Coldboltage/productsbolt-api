import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { WebpageService } from './webpage.service';
import { CreateWebpageDto } from './dto/create-webpage.dto';
import { UpdateWebpageDto } from './dto/update-webpage.dto';

@Controller('webpage')
export class WebpageController {
  constructor(private readonly webpageService: WebpageService) { }

  @Post()
  create(@Body() createWebpageDto: CreateWebpageDto) {
    return this.webpageService.create(createWebpageDto);
  }

  @Get()
  findAll() {
    return this.webpageService.findAll();
  }

  @Get('find-all-divided-by-product')
  findAllWebpagesDividedByProduct() {
    return this.webpageService.findAllWebpagesDividedByProduct();
  }

  @Get('find-all-divided-by-product-slim')
  findAllWebpagesDividedByProductSlim() {
    return this.webpageService.findAllWebpagesDividedByProductSlim();
  }

  @Get('find-all-divided-by-product/:stockState')
  findAllWebpagesDividedByProductsStockState(
    @Param('stockState') stockState: boolean,
  ) {
    return this.webpageService.findAllWebpagesDividedByProductsStockState(
      stockState,
    );
  }

  @Get('find-all-divided-by-product-slim/:stockState')
  findAllWebpagesDividedByProductsStockStateSlim(
    @Param('stockState') stockState: boolean,
  ) {
    return this.webpageService.findAllWebpagesDividedByProductsStockStateSlim(
      stockState,
    );
  }

  @Get('find-all-by-product/:id')
  findAllByProduct(@Param('id') id: string) {
    return this.webpageService.findAllByProduct(id);
  }

  @Get('update-all-pages')
  updateAllPages() {
    return this.webpageService.updateAllPages();
  }

  @Get('update-single-page/:webpageId')
  updatePage(@Param('webpageId') webpageId: string) {
    return this.webpageService.updatePage(webpageId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.webpageService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWebpageDto: UpdateWebpageDto) {
    return this.webpageService.update(id, updateWebpageDto);
  }

  @Delete('/delete-and-update-shop-product-page/:id')
  removeWebpage(@Param('id') id: string) {
    console.log(id);
    return this.webpageService.removeWebpage(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.webpageService.remove(id);
  }
}
