import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ShopProduct } from '../../shop-product/entities/shop-product.entity';
import { WebpageCache } from '../../webpage-cache/entities/webpage-cache.entity';
import { ProductType } from 'src/product/entities/product.entity';

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

  @Column({ default: false })
  disable: boolean;

  @Column({ default: 0 })
  alertCount: number;

  @OneToOne(() => WebpageCache, (webpageCache) => webpageCache.webpage, {
    cascade: ['insert', 'update'],
  })
  webpageCache: WebpageCache;
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

export class CheckPageDto {
  url: string;
  query: string;
  type: ProductType;
  shopWebsite: string;
  webPageId: string;
  shopifySite: boolean;
  hash: string;
  confirmed: boolean;
  count: number;
}

export class ProductToWebpageInterface {
  productName: string;
  webPages: StrippedWebpage[];
}

export class ProductToWebpageSlimInterface {
  productName: string;
  webPages: StrippedWebpageSlim[];
}
