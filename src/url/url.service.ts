import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Url } from './url.entity';
import { DeepPartial, Repository } from 'typeorm';
import { SitemapService } from 'src/sitemap/sitemap.service';

@Injectable()
export class UrlService {
  private readonly logger = new Logger(UrlService.name);
  constructor(
    @InjectRepository(Url) private urlRepository: Repository<Url>,
    private sitemapService: SitemapService,
  ) {}

  async populateUrls() {
    const sitemaps = await this.sitemapService.findAllWithSitemapUrl();
    for (const [index, sitemap] of sitemaps.entries()) {
      this.logger.debug(
        `sitemapUrl being processed: ${sitemap.sitemapUrl}: Number ${index} of ${sitemaps.length}`,
      );

      const uniqueUrls = [...new Set(sitemap.sitemapUrl.backupUrls)];
      const urls: DeepPartial<Url>[] = uniqueUrls.map((url, index) => {
        this.logger.debug(`Url ${index} of ${uniqueUrls.length}`);
        return {
          url,
          sitemapUrl: { id: sitemap.sitemapUrl.id },
        };
      });
      const chunkSize = 10000;

      for (let i = 0; i < urls.length; i += chunkSize) {
        const chunk = urls.slice(i, i + chunkSize);
        this.logger.debug({
          index: i + 1,
          urlsLength: urls.length,
        });
        await this.urlRepository.insert(chunk);
      }
      // await this.urlRepository.save(urls);
    }
    this.logger.debug('complete');
  }
}
