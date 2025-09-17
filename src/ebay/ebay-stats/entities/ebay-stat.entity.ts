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

  // 7 days

  @Column({ default: 0 })
  soldSevenDays: number;

  @Column('decimal', { default: 0 })
  averageSevenDaysSoldPrice: number;

  @Column('decimal', { default: 0 })
  sevenDaySpreadScore: number;

  // 28 days

  @Column({ default: 0 })
  soldTwentyEightDays: number;

  @Column('decimal', { default: 0 })
  averageTwentyEightDaysSoldPrice: number;

  @Column('decimal', { default: 0 })
  twentyEightDaysSpreadScore: number;

  //

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
  cheapestWebpage: CheapestWebpage;
  sevenDaySoldInfo: SoldInfo;
  twentyEightDaySoldInfo: SoldInfo;
  clearPriceRoi: WebsitePriceRoi;
  jitPriceeRoi: WebsitePriceRoi;
  maximisedPriceRoi: WebsitePriceRoi;
  score: number;
}

export interface SoldInfo {
  sold: number;
  averageSoldPrice: number;
  spreadScore: number;
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

export interface CheapestWebpage {
  webpage: string;
  price: number;
}

// export interface SoldInfo {
//   averageSoldPrice: number;
//   soldSevenDays: number;
// }
