import {
  Column,
  PrimaryGeneratedColumn,
  Unique,
  Entity,
  OneToMany,
} from 'typeorm';
import { Alert } from '../../alert/entities/alert.entity';
import { ShopProduct } from '../../shop-product/entities/shop-product.entity';

@Entity()
@Unique(['name', 'type'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: ProductType;

  @Column()
  context: string;

  @OneToMany(() => Alert, (alerts) => alerts.product)
  alerts: Alert[];

  @OneToMany(() => ShopProduct, (shopProducts) => shopProducts.product)
  shopProducts: ShopProduct[];

  @Column({ default: false })
  priority: boolean
}

export enum ProductType {
  PACK = 'PACK',
  BOX = 'BOX',
  BUNDLE = 'BUNDLE',
  ETB = 'ETB',
  COLLECTION = 'COLLECTION',
}

export interface ParsedLinks {
  url: string;
  score: number;
}

export interface BestSitesInterface {
  bestSites: ParsedLinks[];
}

// export interface Product {
//   name: string;
//   type: ProductCapacity;
// }

export interface AnswerInterface {
  website: string;
  inStock: boolean;
  isMainProductPage: boolean;
  isNamedProduct: boolean;
  productTypeMatchStrict: boolean;
  price: number;
  currencyCode: string;
}
