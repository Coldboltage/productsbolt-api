import { Module } from '@nestjs/common';
import { SitemapUrlService } from './sitemap-url.service';
import { SitemapUrlController } from './sitemap-url.controller';

@Module({
  controllers: [SitemapUrlController],
  providers: [SitemapUrlService],
})
export class SitemapUrlModule {}
