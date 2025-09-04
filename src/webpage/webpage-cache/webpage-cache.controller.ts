import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WebpageCacheService } from './webpage-cache.service';
import { CreateWebpageCacheDto } from './dto/create-webpage-cache.dto';
import { UpdateWebpageCacheDto } from './dto/update-webpage-cache.dto';

@Controller('webpage-cache')
export class WebpageCacheController {
  constructor(private readonly webpageCacheService: WebpageCacheService) {}

  @Post()
  create(@Body() createWebpageCacheDto: CreateWebpageCacheDto) {
    return this.webpageCacheService.create(createWebpageCacheDto);
  }

  @Get()
  findAll() {
    return this.webpageCacheService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.webpageCacheService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWebpageCacheDto: UpdateWebpageCacheDto) {
    return this.webpageCacheService.update(+id, updateWebpageCacheDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.webpageCacheService.remove(+id);
  }
}
