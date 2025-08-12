import { Test, TestingModule } from '@nestjs/testing';
import { SitemapController } from './sitemap.controller';
import { SitemapService } from './sitemap.service';

describe('SitemapController', () => {
  let controller: SitemapController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SitemapController],
      providers: [SitemapService],
    }).compile();

    controller = module.get<SitemapController>(SitemapController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
