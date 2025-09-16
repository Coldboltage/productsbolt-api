import { Injectable } from '@nestjs/common';
import { EbayStatsService } from './ebay-stats.service';
import { CreateEbayStatDto } from './dto/create-ebay-stat.dto';
import { Tool } from '@rekog/mcp-nest';
import { CreateEbayStatSchema } from './ebay-stats-schema';

@Injectable()
export class EbayStatsTools {
  constructor(private ebayStatsServices: EbayStatsService) { }

  @Tool({
    name: 'ebayStats.create',
    description: 'Create an eBay stat record',
    parameters: CreateEbayStatSchema, // Zod = runtime guardrails + elicitation
  })
  create(createEbayStatDto: CreateEbayStatDto) {
    return this.ebayStatsServices.create(createEbayStatDto);
  }

  @Tool({
    name: 'ebayStats.nextProductToSell',
    description:
      'Retrieve current product arbitrage stats. Each product includes cheapest source, average sold price, 7-day sold velocity, and ROI tiers (clear, JIT, maximised). To choose the best product, calculate a simple score: score = jitPriceeRoi.roi * soldInfo.soldSevenDays. The product with the highest score is the recommended buy.',
  })
  nextProductToSell() {
    return this.ebayStatsServices.nextProductToSell();
  }
}
