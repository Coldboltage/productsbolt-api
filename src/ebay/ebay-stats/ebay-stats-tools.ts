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
    description: `Retrieve current product arbitrage stats.

    The tool returns an array of products. Each product object has:
    - name: string (product title)
    - cheapestWebpage: { webpage: string (URL), price: string (cheapest sourcing cost) }
    - soldInfo: { 
        averageSoldPrice: string (average eBay sold price in last 7 days), 
        soldSevenDays: number (demand proxy = number of sold listings in last 7 days, adjusted using estimatedSoldQuantity: 
          if estimatedSoldQuantity = 0, treat as 1 unit sold; 
          if estimatedSoldQuantity > 0, count it as that value) 
      }
    - clearPriceRoi: { price: string, roi: number }   // conservative resale price, guaranteed turnover
    - jitPriceeRoi: { price: string, roi: number }   // balanced resale price, realistic turnover
    - maximisedPriceRoi: { price: string, roi: number } // aggressive resale price, highest margin but slower sales

    Decision rule:
    To recommend a product, calculate a score for each product:
    score = jitPriceeRoi.roi * soldInfo.soldSevenDays

    The product with the highest score is the recommended buy/sell opportunity.`,
  })
  nextProductToSell() {
    return this.ebayStatsServices.nextProductToSell();
  }
}
