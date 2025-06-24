import { Test, TestingModule } from '@nestjs/testing';
import { BlackListUrlService } from './blacklist-url.service';

describe('BlackListUrlService', () => {
  let service: BlackListUrlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlackListUrlService],
    }).compile();

    service = module.get<BlackListUrlService>(BlackListUrlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
