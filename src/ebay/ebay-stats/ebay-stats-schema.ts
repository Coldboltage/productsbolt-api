import { z } from 'zod'


export const CreateEbayStatSchema = z.object({
  minPrice: z.number().describe('The minimal price found on Ebay for the price being sold'),
  averagePrice: z.number().describe('The average price found on Ebay for the price being sold'),
  maxPrice: z.number().describe('The maximum price found on Ebay for the price being sold'),
  minActivePrice: z.number().describe('On the Ebay Active listings, the minimum price found'),
  productId: z.string().uuid().describe('The ProductId saved on Productsbolt'),
})

export type CreateAlert = z.infer<typeof CreateEbayStatSchema>;


