import { ShopProduct } from 'src/shop-product/entities/shop-product.entity';
import { WebpageCache } from 'src/webpage-cache/entities/webpage-cache.entity';
import { Webpage } from 'src/webpage/entities/webpage.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['url'])
export class ScrappedPage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column({ default: '' })
  pageTitle: string;

  @Column({ default: '' })
  pageAllText: string;

  @OneToOne(() => Webpage, (webpage) => webpage.scrappedPage)
  webpage: Webpage;

  @OneToOne(() => WebpageCache, (webpageCache) => webpageCache.scrappedPage, {
    cascade: ['insert', 'update'],
  })
  scrappedPageCache: WebpageCache;

  @OneToOne(() => ShopProduct, (shopProduct) => shopProduct.scrappedPage)
  @JoinColumn()
  shopProduct: ShopProduct;

  @ManyToOne(
    () => ShopProduct,
    (shopProduct) => shopProduct.unconfirmedScappedPages,
  )
  unconfirmedScappedPages: ShopProduct[];

  @OneToMany(() => Webpage, (webpage) => webpage.unconfirmedWebPages)
  unconfirmedWebPages: Webpage[];
}
