import { Test, TestingModule } from '@nestjs/testing';
import { SitemapUrlService } from './sitemap-url.service';

describe('SitemapUrlService', () => {
  let service: SitemapUrlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SitemapUrlService],
    }).compile();

    service = module.get<SitemapUrlService>(SitemapUrlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
