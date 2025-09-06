import { Test, TestingModule } from '@nestjs/testing';
import { WebpageCacheController } from './webpage-cache.controller';
import { WebpageCacheService } from './webpage-cache.service';

describe('WebpageCacheController', () => {
  let controller: WebpageCacheController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebpageCacheController],
      providers: [WebpageCacheService],
    }).compile();

    controller = module.get<WebpageCacheController>(WebpageCacheController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
