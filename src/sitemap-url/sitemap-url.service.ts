import { Injectable } from '@nestjs/common';
import { CreateSitemapUrlDto } from './dto/create-sitemap-url.dto';
import { UpdateSitemapUrlDto } from './dto/update-sitemap-url.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SitemapUrl } from './entities/sitemap-url.entity';
import { Repository } from 'typeorm';
import { SitemapService } from 'src/sitemap/sitemap.service';

@Injectable()
export class SitemapUrlService {
  constructor(
    @InjectRepository(SitemapUrl)
    private sitemapUrlRepository: Repository<SitemapUrl>,
    private sitemapService: SitemapService,
  ) {}
  create(createSitemapUrlDto: CreateSitemapUrlDto) {
    return 'This action adds a new sitemapUrl';
  }

  async createAndPairSitemap() {
    const sitemaps = await this.sitemapService.findAll();
    const filteredSitemaps = sitemaps.filter((sitemap) => {
      return !sitemap.sitemapUrl ? true : false;
    });
    for (const sitemap of filteredSitemaps) {
      await this.sitemapUrlRepository.save({ urls: [''], sitemap });
    }
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
