import { Test, TestingModule } from '@nestjs/testing';
import { CandidatePageCacheService } from './candidate-page-cache.service';

describe('CandidatePageCacheService', () => {
  let service: CandidatePageCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CandidatePageCacheService],
    }).compile();

    service = module.get<CandidatePageCacheService>(CandidatePageCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
