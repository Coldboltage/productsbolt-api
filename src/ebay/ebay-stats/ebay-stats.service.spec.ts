import { Test, TestingModule } from '@nestjs/testing';
import { EbayStatsService } from './ebay-stats.service';

describe('EbayStatsService', () => {
  let service: EbayStatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EbayStatsService],
    }).compile();

    service = module.get<EbayStatsService>(EbayStatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
