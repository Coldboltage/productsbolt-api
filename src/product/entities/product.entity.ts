import {
  Column,
  PrimaryGeneratedColumn,
  Unique,
  Entity,
  OneToMany,
  OneToOne,
  ManyToOne,
} from 'typeorm';
import { Alert } from '../../alert/entities/alert.entity';
import { ShopProduct } from '../../shop-product/entities/shop-product.entity';
import { EbayStat } from '../../ebay/ebay-stats/entities/ebay-stat.entity';
import { Brand } from 'src/brand/entities/brand.entity';

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

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
  })
  price: number;

  @Column({ type: 'date', nullable: true })
  releaseDate: Date;

  @OneToMany(() => Alert, (alerts) => alerts.product)
  alerts: Alert[];

  @OneToMany(() => ShopProduct, (shopProducts) => shopProducts.product)
  shopProducts: ShopProduct[];

  @Column({ default: false })
  priority: boolean;

  @Column({ default: '' })
  urlSafeName: string;

  @Column({ nullable: true })
  imageUrl: string;

  @OneToOne(() => EbayStat, (ebayStat) => ebayStat.product)
  ebayStat: EbayStat;

  @ManyToOne(() => Brand, (brand) => brand.products)
  brand: Brand;
}

export enum ProductType {
  PACK = 'PACK',
  BOX = 'BOX',
  BUNDLE = 'BUNDLE',
  ETB = 'ETB',
  COLLECTION = 'COLLECTION',
}

export enum BrandType {
  MAGIC = 'magic-the-gathering',
  POKEMON = 'pokemon',
  RIFTBOUND = 'riftbound',
  ONEPIECE = 'one-piece',
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
  packagingTypeMatch: boolean;
  price: number;
  currencyCode: string;
}

export interface ProductStripped {
  id: string;
  name: string;
  brand: string;
  urlSafeName: string;
  imageUrl: string;
  releaseDate: Date;
}
