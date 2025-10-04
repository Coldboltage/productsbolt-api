import { Test, TestingModule } from '@nestjs/testing';
import { CandidatePageController } from './candidate-page.controller';
import { CandidatePageService } from './candidate-page.service';

describe('CandidatePageController', () => {
  let controller: CandidatePageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidatePageController],
      providers: [CandidatePageService],
    }).compile();

    controller = module.get<CandidatePageController>(CandidatePageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
