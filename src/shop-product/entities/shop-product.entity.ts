import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Shop } from '../../shop/entities/shop.entity';
import { Product } from '../../product/entities/product.entity';
import { Webpage } from '../../webpage/entities/webpage.entity';
import { EbayProductDetail } from 'src/ebay/entities/ebay-product-detail.entity';
import { CandidatePage } from 'src/candidate-page/entities/candidate-page.entity';
import { ShopProductBlacklistUrl } from 'src/shop-product-backlist-url/entities/shop-product-blacklist-url.entity';

@Entity()
@Unique(['name', 'shopId', 'productId'])
@Index(['product'])
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

  @ManyToOne(() => Product, (product) => product.shopProducts, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @OneToMany(
    () => ShopProductBlacklistUrl,
    (shopProductBlacklistUrls) => shopProductBlacklistUrls.shopProduct,
    {
      cascade: ['insert', 'update'],
    },
  )
  shopProductBlacklistUrls: ShopProductBlacklistUrl[];

  @OneToOne(() => Webpage, (webPage) => webPage.shopProduct)
  webPage: Webpage;

  @OneToOne(
    () => EbayProductDetail,
    (ebayProductDetail) => ebayProductDetail.shopProduct,
  )
  @JoinColumn()
  ebayProductDetail: EbayProductDetail;

  @OneToMany(
    () => CandidatePage,
    (candidatePage) => candidatePage.shopProduct,
    {
      nullable: true,
    },
  )
  candidatePages: CandidatePage[];
}
