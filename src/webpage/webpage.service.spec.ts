import { Test, TestingModule } from '@nestjs/testing';
import { WebpageService } from './webpage.service';

describe('WebpageService', () => {
  let service: WebpageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebpageService],
    }).compile();

    service = module.get<WebpageService>(WebpageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
