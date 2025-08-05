import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WebpageUtilsService } from './webpage-utils.service';
import { CreateWebpageUtilDto } from './dto/create-webpage-util.dto';
import { UpdateWebpageUtilDto } from './dto/update-webpage-util.dto';

@Controller('webpage-utils')
export class WebpageUtilsController {
  constructor(private readonly webpageUtilsService: WebpageUtilsService) {}

  @Post()
  create(@Body() createWebpageUtilDto: CreateWebpageUtilDto) {
    return this.webpageUtilsService.create(createWebpageUtilDto);
  }

  @Get()
  findAll() {
    return this.webpageUtilsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.webpageUtilsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWebpageUtilDto: UpdateWebpageUtilDto) {
    return this.webpageUtilsService.update(+id, updateWebpageUtilDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.webpageUtilsService.remove(+id);
  }
}
