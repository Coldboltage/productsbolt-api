import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EbayService } from './ebay.service';
import { CreateEbayDto } from './dto/create-ebay.dto';
import { UpdateEbayDto } from './dto/update-ebay.dto';

@Controller('ebay')
export class EbayController {
  constructor(private readonly ebayService: EbayService) {}

  @Post()
  create(@Body() createEbayDto: CreateEbayDto) {
    return this.ebayService.create(createEbayDto);
  }

  @Get()
  findAll() {
    return this.ebayService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ebayService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEbayDto: UpdateEbayDto) {
    return this.ebayService.update(+id, updateEbayDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ebayService.remove(+id);
  }
}
