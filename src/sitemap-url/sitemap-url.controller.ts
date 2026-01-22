import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SitemapUrlService } from './sitemap-url.service';
import { CreateSitemapUrlDto } from './dto/create-sitemap-url.dto';
import { UpdateSitemapUrlDto } from './dto/update-sitemap-url.dto';

@Controller('sitemap-url')
export class SitemapUrlController {
  constructor(private readonly sitemapUrlService: SitemapUrlService) {}

  @Post()
  create(@Body() createSitemapUrlDto: CreateSitemapUrlDto) {
    return this.sitemapUrlService.create(createSitemapUrlDto);
  }

  @Post('/create-and-pair-sitemap')
  createAndPairSitemap() {
    return this.sitemapUrlService.createAndPairSitemap();
  }

  @Get()
  findAll() {
    return this.sitemapUrlService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sitemapUrlService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSitemapUrlDto: UpdateSitemapUrlDto,
  ) {
    return this.sitemapUrlService.update(+id, updateSitemapUrlDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sitemapUrlService.remove(+id);
  }
}
