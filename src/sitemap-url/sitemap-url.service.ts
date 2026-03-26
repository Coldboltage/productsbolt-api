import { Injectable, Logger } from '@nestjs/common';
import { CreateSitemapUrlDto } from './dto/create-sitemap-url.dto';
import { UpdateSitemapUrlDto } from './dto/update-sitemap-url.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SitemapUrl } from './entities/sitemap-url.entity';
import { Repository } from 'typeorm';
import { SitemapService } from 'src/sitemap/sitemap.service';
import { CreateUrlDto } from 'src/url/dto/create-url.dto';

@Injectable()
export class SitemapUrlService {
  private readonly logger = new Logger(SitemapUrlService.name);
  constructor(
    @InjectRepository(SitemapUrl)
    private sitemapUrlRepository: Repository<SitemapUrl>,
    private sitemapService: SitemapService,
  ) {}
  create(createSitemapUrlDto: CreateSitemapUrlDto) {
    return 'This action adds a new sitemapUrl';
  }

  // async createAndPairSitemap() {
  //   const sitemaps = await this.sitemapService.findAll();
  //   const filteredSitemaps = sitemaps.filter((sitemap) => {
  //     return !sitemap.sitemapUrl ? true : false;
  //   });
  //   for (const sitemap of filteredSitemaps) {
  //     await this.sitemapUrlRepository.save({
  //       urls: [''],
  //       sitemap,
  //     });
  //   }
  // }

  // async backupUrls() {
  //   this.logger.log(`backing up urls`);
  //   const sitemapUrlsList = await this.sitemapUrlRepository.find();
  //   for (const sitemapUrl of sitemapUrlsList) {
  //     this.logger.log(
  //       `backing up urls for ${sitemapUrl.id} with ${sitemapUrl.urls.length} urls`,
  //     );
  //     await this.sitemapUrlRepository.update(sitemapUrl.id, {
  //       backupUrls: sitemapUrl.urls,
  //     });
  //   }
  // }

  async createUrl(createUrls: CreateUrlDto[]) {
    console.log(createUrls);
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
