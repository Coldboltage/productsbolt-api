import { Test, TestingModule } from '@nestjs/testing';
import { ScrappedPageService } from './scrapped-page.service';

describe('ScrappedPageService', () => {
  let service: ScrappedPageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScrappedPageService],
    }).compile();

    service = module.get<ScrappedPageService>(ScrappedPageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
