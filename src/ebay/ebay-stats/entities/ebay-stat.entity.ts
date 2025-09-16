import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../../product/entities/product.entity';

@Entity()
export class EbayStat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Product, (product) => product.ebayStat)
  @JoinColumn()
  product: Product;

  @Column('decimal', { nullable: true })
  minPrice: number;

  @Column('decimal', { nullable: true })
  averagePrice: number;

  @Column('decimal', { nullable: true })
  maxPrice: number;

  @Column('decimal', { nullable: true })
  minActivePrice: number;

  // cached strategy prices (optional)
  @Column('decimal', { nullable: true })
  jitPrice: number;

  @Column('decimal', { nullable: true })
  clearPrice: number;

  @Column('decimal', { nullable: true })
  maximisedPrice: number;

  @Column({ default: 0 })
  soldSevenDays: number;

  @Column('decimal', { default: 0 })
  averageSoldPrice: number;

  @Column('simple-json', { default: () => "'[]'" }) // Postgres JSON as default
  ebayListings: EbayListings[];
}

export interface EbayListings {
  name: string;
  price: string;
  dateCreatd: Date;
  sales: number;
}

export interface PricePoints {
  name: string;
  webpage: string;
  price: number;
  clearPriceRoi: WebsitePriceRoi;
  jitPriceeRoi: WebsitePriceRoi;
  maximisedPriceRoi: WebsitePriceRoi;
}

export interface WebsitePriceRoi {
  price: number;
  roi: number;
}

export interface CalculatedPricePoints {
  clearPrice: number;
  jitPrice: number;
  maximisedPrice: number;
}
