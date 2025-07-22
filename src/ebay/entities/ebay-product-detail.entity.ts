import { ShopProduct } from 'src/shop-product/entities/shop-product.entity';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class EbayProductDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @OneToOne(() => ShopProduct, (shopProduct) => shopProduct.ebayProductDetail)
  shopProduct: ShopProduct;
}
