import { ShopProductBlacklistUrl } from 'src/shop-product-backlist-url/entities/shop-product-blacklist-url.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BlackListUrl {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @OneToMany(
    () => ShopProductBlacklistUrl,
    (shopProductBlacklistUrls) => shopProductBlacklistUrls.blackListUrl,
    {
      onDelete: 'CASCADE',
    },
  )
  shopProductBlacklistUrls: ShopProductBlacklistUrl[];
}
