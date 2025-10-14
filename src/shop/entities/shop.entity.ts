import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ShopProduct } from '../../shop-product/entities/shop-product.entity';
import { Sitemap } from '../../sitemap/entities/sitemap.entity';
import { ShopListing } from 'src/shop-listing/entities/shop-listing.entity';

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

  @Column({ default: false })
  cloudflare: boolean;

  @Column({ enum: UniqueShopType, nullable: true })
  uniqueShopType: UniqueShopType;

  @OneToMany(() => ShopProduct, (shopProduct) => shopProduct.shop)
  shopProducts: ShopProduct[];

  @OneToOne(() => Sitemap, (sitemapEntity) => sitemapEntity.shop, {
    cascade: ['insert', 'update'],
  })
  sitemapEntity: Sitemap;

  @OneToMany(() => ShopListing, (shopListing) => shopListing.shop)
  shopListings: ShopListing[];
}
