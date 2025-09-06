import { Test, TestingModule } from '@nestjs/testing';
import { WebpageCacheService } from './webpage-cache.service';

describe('WebpageCacheService', () => {
  let service: WebpageCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebpageCacheService],
    }).compile();

    service = module.get<WebpageCacheService>(WebpageCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
