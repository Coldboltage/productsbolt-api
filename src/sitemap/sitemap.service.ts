import { Injectable } from '@nestjs/common';
import { CreateSitemapDto } from './dto/create-sitemap.dto';
import { UpdateSitemapDto } from './dto/update-sitemap.dto';

@Injectable()
export class SitemapService {
  create(createSitemapDto: CreateSitemapDto) {
    return 'This action adds a new sitemap';
  }

  findAll() {
    return `This action returns all sitemap`;
  }

  findOne(id: number) {
    return `This action returns a #${id} sitemap`;
  }

  update(id: number, updateSitemapDto: UpdateSitemapDto) {
    return `This action updates a #${id} sitemap`;
  }

  remove(id: number) {
    return `This action removes a #${id} sitemap`;
  }
}
