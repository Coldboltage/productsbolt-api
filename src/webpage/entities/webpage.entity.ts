import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ShopProduct } from '../../shop-product/entities/shop-product.entity';

@Entity()
@Unique(['url'])
export class Webpage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column()
  inStock: boolean;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column()
  currencyCode: string;

  @Column()
  reason: string;

  @ManyToOne(() => ShopProduct, (shopProduct) => shopProduct.webPages, {
    onDelete: 'CASCADE',
    cascade: ['update'],
  })
  shopProduct: ShopProduct;
}

export interface StrippedWebpage {
  id: string;
  url: string;
  inStock: boolean;
  price: number;
  currencyCode: string;
  reason: string;
}

export interface StrippedWebpageSlim {
  id: string;
  url: string;
  inStock: boolean;
  price: number;
  currencyCode: string;
}
