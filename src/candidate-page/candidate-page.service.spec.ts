import { Test, TestingModule } from '@nestjs/testing';
import { CandidatePageService } from './candidate-page.service';

describe('CandidatePageService', () => {
  let service: CandidatePageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CandidatePageService],
    }).compile();

    service = module.get<CandidatePageService>(CandidatePageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
