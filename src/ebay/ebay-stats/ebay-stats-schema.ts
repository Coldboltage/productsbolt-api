import { z } from 'zod';

export const CreateEbayStatSchema = z.object({
  minPrice: z
    .number()
    .describe('The minimal price found on Ebay for the price being sold'),
  averagePrice: z
    .number()
    .describe('The average price found on Ebay for the price being sold'),
  maxPrice: z
    .number()
    .describe('The maximum price found on Ebay for the price being sold'),
  minActivePrice: z
    .number()
    .describe('On the Ebay Active listings, the minimum price found'),
  productId: z.string().uuid().describe('The ProductId saved on Productsbolt'),
});

export type CreateEbayStatStatInference = z.infer<typeof CreateEbayStatSchema>;

export const UpdateEbayStatsSchema = CreateEbayStatSchema.partial().extend({
  clearPrice: z
    .number()
    .optional()
    .describe(
      'The lowest to sell at in relation to the current selling price and our bought price on ebay',
    ),
  jitPrice: z
    .number()
    .optional()
    .describe(
      'The price that allows for the stock to be sold in a just in time motion on ebay',
    ),
  maximisedPrice: z
    .number()
    .optional()
    .describe('The maximum one can sell the product at on ebay'),
});

export type UpdateEbayStatsInference = z.infer<typeof UpdateEbayStatsSchema>;
