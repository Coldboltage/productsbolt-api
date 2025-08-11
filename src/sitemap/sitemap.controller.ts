import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SitemapService } from './sitemap.service';
import { CreateSitemapDto } from './dto/create-sitemap.dto';
import { UpdateSitemapDto } from './dto/update-sitemap.dto';

@Controller('sitemap')
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  @Post()
  create(@Body() createSitemapDto: CreateSitemapDto) {
    return this.sitemapService.create(createSitemapDto);
  }

  @Get()
  findAll() {
    return this.sitemapService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sitemapService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSitemapDto: UpdateSitemapDto) {
    return this.sitemapService.update(+id, updateSitemapDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sitemapService.remove(+id);
  }
}
