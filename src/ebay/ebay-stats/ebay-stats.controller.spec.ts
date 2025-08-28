import { Test, TestingModule } from '@nestjs/testing';
import { EbayStatsController } from './ebay-stats.controller';
import { EbayStatsService } from './ebay-stats.service';

describe('EbayStatsController', () => {
  let controller: EbayStatsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EbayStatsController],
      providers: [EbayStatsService],
    }).compile();

    controller = module.get<EbayStatsController>(EbayStatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
