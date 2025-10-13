import { Test, TestingModule } from '@nestjs/testing';
import { CandidatePageCacheController } from './candidate-page-cache.controller';
import { CandidatePageCacheService } from './candidate-page-cache.service';

describe('CandidatePageCacheController', () => {
  let controller: CandidatePageCacheController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidatePageCacheController],
      providers: [CandidatePageCacheService],
    }).compile();

    controller = module.get<CandidatePageCacheController>(CandidatePageCacheController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
