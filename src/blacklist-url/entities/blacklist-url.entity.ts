import { shopProductBlacklistUrl } from 'src/shop-product-backlist-url/entities/shop-product-blacklist-url.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class BlackListUrl {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @OneToMany(
    () => shopProductBlacklistUrl,
    (shopProductBlacklistUrls) => shopProductBlacklistUrls.blackListUrl,
    {
      onDelete: 'CASCADE',
    },
  )
  shopProductBlacklistUrls: shopProductBlacklistUrl[];
}
