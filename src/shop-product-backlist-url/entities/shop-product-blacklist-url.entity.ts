import { BlackListUrl } from 'src/blacklist-url/entities/blacklist-url.entity';
import { ShopProduct } from 'src/shop-product/entities/shop-product.entity';
import { ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Entity } from 'typeorm/decorator/entity/Entity';

@Entity()
@Unique(['shopProduct', 'blackListUrl'])
export class ShopProductBlacklistUrl {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => ShopProduct,
    (shopProduct) => shopProduct.shopProductBlacklistUrls,
    {
      onDelete: 'CASCADE',
    },
  )
  shopProduct: ShopProduct;

  @ManyToOne(
    () => BlackListUrl,
    (blackListUrl) => blackListUrl.shopProductBlacklistUrls,
    {
      onDelete: 'CASCADE',
    },
  )
  blackListUrl: BlackListUrl;
}
