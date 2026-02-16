import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import z from 'zod';
import { WebpageService } from './webpage.service';

@Injectable()
export class WebpageTools {
  constructor(private webpageService: WebpageService) {}

  // @Tool({
  //   name: 'webpage.findAll',
  //   description: 'Finds every webpage which has a shopProduct',
  //   // no inputs needed
  //   parameters: z.object({}),
  // })
  // async findWebpage() {
  //   return this.webpageService.findAll();
  // }
  @Tool({
    name: 'webpage.find-all-divided-by-products-stock-state',
    description:
      'Returns a JSON array where each item represents a product, including the product name and an array of its associated webpages.',
    parameters: z.object({
      state: z.coerce
        .boolean()
        .describe(
          'true to get only in-stock webpages, false to get only out-of-stock webpages',
        ),
    }),
  })
  async findAllWebpagesDividedByProductsStockStateSlim(params: {
    state: boolean;
  }) {
    const result =
      await this.webpageService.findAllWebpagesDividedByProductsStockStateSlim(
        params.state,
      );

    // This ensures pretty JSON instead of one-line escaped string
    return result;
  }

  @Tool({
    name: 'Find all webpages for specific product and instock state',
    description:
      'Returns a JSON array where each item represents the chosen product and state, including the product name and an array of its associated webpages.',
    parameters: z.object({
      state: z.coerce
        .boolean()
        .describe(
          'true to get only in-stock webpages, false to get only out-of-stock webpages',
        ),
      productId: z.coerce.string().describe('UUID of chosen product'),
    }),
  })
  async findAllWebpagesDividedByProductIdStockStateSlim(params: {
    state: boolean;
    productId: string;
  }) {
    const result =
      await this.webpageService.findAllWebpagesDividedByProductIdStockStateSlim(
        params.state,
        params.productId,
      );

    // This ensures pretty JSON instead of one-line escaped string
    return result;
  }
}
