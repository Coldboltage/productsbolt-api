import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class EbayProductDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  productId: string
}