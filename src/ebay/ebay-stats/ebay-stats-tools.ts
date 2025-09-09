import { Injectable } from "@nestjs/common";
import { EbayStatsService } from "./ebay-stats.service";
import { CreateEbayStatDto } from "./dto/create-ebay-stat.dto";
import { Tool } from "@rekog/mcp-nest";
import { CreateEbayStatSchema } from "./ebay-stats-schema";

@Injectable()
export class EbayStatsTools {
  constructor(private ebayStatsServices: EbayStatsService) {}

  @Tool({
    name: 'ebayStats.create',
    description: 'Create an eBay stat record',
    parameters: CreateEbayStatSchema,       // Zod = runtime guardrails + elicitation
  })
  create(createEbayStatDto: CreateEbayStatDto) {
    return this.ebayStatsServices.create(createEbayStatDto)
  }
}