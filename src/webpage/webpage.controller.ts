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
import { WebpageService } from './webpage.service';
import { CreateWebpageDto } from './dto/create-webpage.dto';
import { UpdateWebpageDto } from './dto/update-webpage.dto';
import {
  ProductToWebpageInterface,
  ProductToWebpageSlimInterface,
  StrippedWebpageSlim,
  Webpage,
} from './entities/webpage.entity';

@Controller('webpage')
export class WebpageController {
  constructor(private readonly webpageService: WebpageService) {}

  @Post()
  create(@Body() createWebpageDto: CreateWebpageDto): Promise<Webpage> {
    return this.webpageService.create(createWebpageDto);
  }

  @Get()
  findAll(): Promise<Webpage[]> {
    return this.webpageService.findAll();
  }

  @Get('find-all-divided-by-product')
  findAllWebpagesDividedByProduct(): Promise<ProductToWebpageInterface[]> {
    return this.webpageService.findAllWebpagesDividedByProduct();
  }

  @Get('find-all-divided-by-product-slim')
  findAllWebpagesDividedByProductSlim(): Promise<
    ProductToWebpageSlimInterface[]
  > {
    return this.webpageService.findAllWebpagesDividedByProductSlim();
  }

  @Get('find-all-divided-by-product/:stockState')
  findAllWebpagesDividedByProductsStockState(
    @Param('stockState') stockState: boolean,
  ): Promise<ProductToWebpageInterface[]> {
    return this.webpageService.findAllWebpagesDividedByProductsStockState(
      stockState,
    );
  }

  @Get('find-all-divided-by-product-slim/:stockState/:productId')
  findAllWebpagesDividedByProductIdStockStateSlim(
    @Param('stockState') stockState: boolean,
    @Param('productId') productId: string,
  ): Promise<ProductToWebpageSlimInterface> {
    return this.webpageService.findAllWebpagesDividedByProductIdStockStateSlim(
      stockState,
      productId,
    );
  }

  @Get('find-all-divided-by-product-slim-product-name/:stockState/:productName')
  findAllWebpagesDividedByProductNameStockStateSlim(
    @Param('stockState') stockState: boolean,
    @Param('productName') productName: string,
  ): Promise<ProductToWebpageSlimInterface> {
    console.log(productName);
    return this.webpageService.findAllWebpagesDividedByProductNameStockStateSlim(
      stockState,
      productName,
    );
  }

  // @Get('find-all-divided-by-product-slim-brand-name/:stockState/:brandName')
  // findAllWebpagesDividedByBrandNameStockStateSlim(
  //   @Param('stockState') stockState: boolean,
  //   @Param('brandName') brandName: string,
  // ): Promise<ProductToWebpageSlimInterface> {
  //   console.log(brandName);
  //   return this.webpageService.findAllWebpagesDividedByBrandNameStockStateSlim(
  //     stockState,
  //     brandName,
  //   );
  // }

  @Get('find-all-divided-by-product-slim/:stockState')
  findAllWebpagesDividedByProductsStockStateSlim(
    @Param('stockState') stockState: boolean,
  ): Promise<ProductToWebpageSlimInterface[]> {
    return this.webpageService.findAllWebpagesDividedByProductsStockStateSlim(
      stockState,
    );
  }

  @Get('find-all-by-product/:id')
  findAllByProduct(@Param('id') id: string): Promise<Webpage[]> {
    console.log('hello');
    return this.webpageService.findAllByProduct(id);
  }

  @Get('update-all-pages')
  updateAllPages(): Promise<void> {
    return this.webpageService.updateAllPages();
  }

  @Get('update-all-pages-high-priority')
  updateHighPriorityWebpages(): Promise<void> {
    return this.webpageService.updateHighPriorityWebpages();
  }

  @Get('update-single-page/:webpageId')
  updatePage(@Param('webpageId') webpageId: string): Promise<void> {
    return this.webpageService.updatePage(webpageId);
  }

  @Get('show-products-true')
  showProductsTrue(): Promise<StrippedWebpageSlim[]> {
    return this.webpageService.showProductsTrue();
  }

  @Get('cache-not-found')
  findAllWithoutCache() {
    return this.webpageService.findAllWithoutCache();
  }

  @Get('does-webpage-exist-in-sitemap')
  doesWebpageExistInSitemap() {
    return this.webpageService.doesWebpageExistInSitemap();
  }

  @Get('/find-page-inspected/:inspected')
  findPageToBeInspected(@Param('inspected', ParseBoolPipe) inspected: boolean) {
    return this.webpageService.findPageToBeInspected(inspected);
  }

  @Get('find-all-price-match-edition-match')
  findAllPriceMatchEditionMatch() {
    return this.webpageService.findAllPriceMatchEditionMatch();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Webpage> {
    return this.webpageService.findOne(id);
  }

  @Post('/reset-alert-and-enable')
  resetAlertCount() {
    return this.webpageService.resetAlertCount();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWebpageDto: UpdateWebpageDto,
  ): Promise<Webpage> {
    return this.webpageService.update(id, updateWebpageDto);
  }

  @Delete('delete-and-update-shop-product-page-by-shopProductId/:shopProductId')
  removeShopProductWebpages(
    @Param('shopProductId') shopProductId: string,
  ): Promise<boolean> {
    console.log(shopProductId);
    return this.webpageService.removeShopProductWebpages(shopProductId);
  }

  @Delete('delete-and-update-shop-product-page-by-product/:product')
  removeProductWebpages(@Param('product') product: string): Promise<boolean> {
    console.log(product);
    return this.webpageService.removeProductWebpages(product);
  }

  @Delete('/delete-and-update-shop-product-page/:id')
  removeWebpage(@Param('id') id: string): Promise<boolean> {
    console.log(id);
    return this.webpageService.removeWebpage(id);
  }

  @Delete('/delete-and-update-shop-product-page-all')
  removeAllWebPages(@Param('id') id: string): Promise<void> {
    console.log(id);
    return this.webpageService.removeAllWebPages();
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Webpage> {
    return this.webpageService.remove(id);
  }
}
