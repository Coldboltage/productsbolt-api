import { Module } from '@nestjs/common';
import { UrlController } from './url.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Url } from './url.entity';
import { UrlService } from './url.service';
import { SitemapModule } from 'src/sitemap/sitemap.module';

@Module({
  imports: [TypeOrmModule.forFeature([Url]), SitemapModule],
  controllers: [UrlController],
  providers: [UrlService],
  exports: [UrlService],
})
export class UrlModule {}
