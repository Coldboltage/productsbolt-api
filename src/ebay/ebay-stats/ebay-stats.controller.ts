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

@Controller('ebay-stats')
export class EbayStatsController {
  constructor(private readonly ebayStatsService: EbayStatsService) { }

  @Post()
  create(@Body() createEbayStatDto: CreateEbayStatDto) {
    return this.ebayStatsService.create(createEbayStatDto);
  }

  @Get()
  findAll() {
    return this.ebayStatsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ebayStatsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEbayStatDto: UpdateEbayStatDto,
  ) {
    return this.ebayStatsService.update(id, updateEbayStatDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ebayStatsService.remove(+id);
  }
}
