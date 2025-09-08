import { IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateAlertDto {
  @IsString()
  name: string;

  @IsUUID()
  productId: string;

  @IsNumber()
  price: number;
}
