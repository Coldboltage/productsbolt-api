import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EbayStatsService } from './ebay-stats.service';
import { CreateEbayStatDto } from './dto/create-ebay-stat.dto';
import { UpdateEbayStatDto } from './dto/update-ebay-stat.dto';
import { WebpageService } from '../../webpage/webpage.service';
import { EbayStat, PricePoints } from './entities/ebay-stat.entity';
import { UpdateResult } from 'typeorm';

@Controller('ebay-stats')
export class EbayStatsController {
  constructor(private readonly ebayStatsService: EbayStatsService) { }

  @Post()
  create(@Body() createEbayStatDto: CreateEbayStatDto): Promise<EbayStat> {
    return this.ebayStatsService.create(createEbayStatDto);
  }

  @Post('next-product-to-sell')
  nextProductToSell(): Promise<PricePoints[]> {
    return this.ebayStatsService.nextProductToSell();
  }

  @Post('price-points')
  pricePoints(): Promise<void> {
    return this.ebayStatsService.bestWebpageToCalc();
  }

  @Post('product-ebay-stat-automatic/:productId')
  specificProductEbayStatAutomatic(@Param('productId') productId: string) {
    return this.ebayStatsService.specificProductEbayStatAutomatic(productId);
  }

  @Get()
  findAll(): Promise<EbayStat[]> {
    return this.ebayStatsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<EbayStat> {
    return this.ebayStatsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEbayStatDto: UpdateEbayStatDto,
  ): Promise<UpdateResult> {
    return this.ebayStatsService.update(id, updateEbayStatDto);
  }

  @Patch('/patch-and-update-price-points/:id')
  patchAndUpdatePricePoints(
    @Param('id') id: string,
    @Body() updateEbayStatDto: UpdateEbayStatDto,
  ) {
    return this.ebayStatsService.patchAndUpdatePricePoints(
      id,
      updateEbayStatDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<EbayStat> {
    return this.ebayStatsService.remove(id);
  }
}
