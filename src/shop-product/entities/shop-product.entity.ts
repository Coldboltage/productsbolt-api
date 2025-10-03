import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Shop } from '../../shop/entities/shop.entity';
import { Product } from '../../product/entities/product.entity';
import { Webpage } from '../../webpage/entities/webpage.entity';
import { BlackListUrl } from '../../blacklist-url/entities/blacklist-url.entity';
import { EbayProductDetail } from 'src/ebay/entities/ebay-product-detail.entity';
import { ScrappedPage } from 'src/scrapped-page/entities/scrapped-page.entity';

@Entity()
@Unique(['name', 'shopId', 'productId'])
export class ShopProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  shopId: string;

  @Column()
  productId: string;

  @Column({ default: false })
  populated: boolean;

  @Column({ default: '', type: 'simple-array' })
  links: string[];

  @ManyToOne(() => Shop, (shop) => shop.shopProducts, {
    onDelete: 'CASCADE',
  })
  shop: Shop;

  @ManyToOne(() => Product, (product) => product.shopProducts)
  product: Product;

  @ManyToMany(() => BlackListUrl, (blacklistUrl) => blacklistUrl.shopProducts, {
    cascade: ['insert', 'update', 'remove'], // cascade changes on blacklist entries
  })
  blacklistUrls: BlackListUrl[];

  @OneToOne(() => Webpage, (webPage) => webPage.shopProduct, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  webPage: Webpage;

  @OneToOne(
    () => EbayProductDetail,
    (ebayProductDetail) => ebayProductDetail.shopProduct,
  )
  @JoinColumn()
  ebayProductDetail: EbayProductDetail;

  @OneToOne(() => ScrappedPage, (scrappedPage) => scrappedPage.shopProduct)
  @JoinColumn()
  scrappedPage: ScrappedPage;

  @ManyToOne(() => ScrappedPage, (scrappedPages) => scrappedPages.shopProduct)
  unconfirmedPages: ScrappedPage[];
}
