import { ShopProduct } from 'src/shop-product/entities/shop-product.entity';
import { WebpageCache } from 'src/webpage-cache/entities/webpage-cache.entity';
import { Webpage } from 'src/webpage/entities/webpage.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['url', 'shopProductId'])
export class ScrappedPage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column({ default: '' })
  pageTitle: string;

  @Column({ default: '' })
  pageAllText: string;

  @Column({ type: 'uuid' })
  shopProductId: string;

  @OneToOne(() => Webpage, (webpage) => webpage.scrappedPage)
  webpage: Webpage;

  @OneToOne(() => WebpageCache, (webpageCache) => webpageCache.scrappedPage)
  webpageCache: WebpageCache;

  @OneToOne(() => ShopProduct, (shopProduct) => shopProduct.scrappedPage)
  @JoinColumn()
  shopProduct: ShopProduct;

  @ManyToOne(() => ShopProduct, (shopProduct) => shopProduct.unconfirmedPages)
  unconfirmedPages: ShopProduct[];
}
