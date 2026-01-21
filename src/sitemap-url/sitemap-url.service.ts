import { Injectable } from '@nestjs/common';
import { CreateSitemapUrlDto } from './dto/create-sitemap-url.dto';
import { UpdateSitemapUrlDto } from './dto/update-sitemap-url.dto';

@Injectable()
export class SitemapUrlService {
  create(createSitemapUrlDto: CreateSitemapUrlDto) {
    return 'This action adds a new sitemapUrl';
  }

  findAll() {
    return `This action returns all sitemapUrl`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sitemapUrl`;
  }

  update(id: number, updateSitemapUrlDto: UpdateSitemapUrlDto) {
    return `This action updates a #${id} sitemapUrl`;
  }

  remove(id: number) {
    return `This action removes a #${id} sitemapUrl`;
  }
}
