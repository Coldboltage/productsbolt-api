import { IsBoolean, IsNumber, IsString } from 'class-validator';
import * as z from 'zod';

export class CreateWebpageSnapshotDto {
  @IsString()
  url: string;

  @IsBoolean()
  inStock: boolean;

  @IsNumber()
  price: number;

  @IsNumber()
  euroPrice: number;

  @IsString()
  currencyCode: string;

  @IsString()
  webpageId: string;
}

export const CreateWebpageSnapshotDtoSchema = z.object({
  url: z.string(),
  inStock: z.boolean(),
  price: z.number(),
  euroPrice: z.number(),
  currencyCode: z.string(),
  webpageId: z.string(),
});

export type CreateWebpageSnapshotDtoInfer = z.infer<
  typeof CreateWebpageSnapshotDtoSchema
>;
