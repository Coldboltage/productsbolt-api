import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ShopProduct } from '../../shop-product/entities/shop-product.entity';

export enum UniqueShopType {
  TIKTOK = 'TIKTOK',
  EBAY = 'EBAY',
  AMAZON = 'AMAZON',
}

@Entity()
@Unique(['name', 'website'])
export class Shop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  website: string;

  @Column()
  sitemap: string;

  @Column('simple-array', { default: '' })
  sitemapUrls: string[];

  @Column()
  category: string;

  @Column()
  protocol: string;

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  isShopifySite: boolean;

  @Column({ nullable: true })
  etag: string;

  @Column({ default: 0 })
  etagCount: number;

  @Column({ enum: UniqueShopType, nullable: true })
  uniqueShopType: UniqueShopType;

  @OneToMany(() => ShopProduct, (shopProduct) => shopProduct.shop)
  shopProducts: ShopProduct[];
}
