import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SitemapService } from './sitemap.service';
import { CreateSitemapDto } from './dto/create-sitemap.dto';
import { UpdateSitemapDto } from './dto/update-sitemap.dto';
import { Sitemap } from './entities/sitemap.entity';
import { UpdateResult } from 'typeorm';

@Controller('sitemap')
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) { }

  @Post()
  create(@Body() createSitemapDto: CreateSitemapDto): Promise<Sitemap> {
    return this.sitemapService.create(createSitemapDto);
  }

  @Post('/generated-sitemap-all-shops')
  generateSitemapAllShops(): Promise<void> {
    return this.sitemapService.generateSitemapAllShops();
  }

  @Post('/reset-all-fast-mode')
  resetAllFastMode(): Promise<void> {
    return this.sitemapService.resetAllFastMode();
  }

  @Get()
  findAll(): Promise<Sitemap[]> {
    return this.sitemapService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Sitemap> {
    return this.sitemapService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSitemapDto: UpdateSitemapDto): Promise<UpdateResult> {
    console.log("hello")
    return this.sitemapService.update(id, updateSitemapDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Sitemap> {
    return this.sitemapService.remove(id);
  }
}
