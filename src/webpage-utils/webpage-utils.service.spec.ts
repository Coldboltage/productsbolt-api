import { Test, TestingModule } from '@nestjs/testing';
import { WebpageUtilsService } from './webpage-utils.service';

describe('WebpageUtilsService', () => {
  let service: WebpageUtilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebpageUtilsService],
    }).compile();

    service = module.get<WebpageUtilsService>(WebpageUtilsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
