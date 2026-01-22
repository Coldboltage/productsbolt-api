import { Test, TestingModule } from '@nestjs/testing';
import { SitemapUrlController } from './sitemap-url.controller';
import { SitemapUrlService } from './sitemap-url.service';

describe('SitemapUrlController', () => {
  let controller: SitemapUrlController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SitemapUrlController],
      providers: [SitemapUrlService],
    }).compile();

    controller = module.get<SitemapUrlController>(SitemapUrlController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
