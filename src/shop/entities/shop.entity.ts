import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ShopProduct } from '../../shop-product/entities/shop-product.entity';

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

  @Column('simple-array', { default: '' })
  sitemapUrls: string[];

  @Column()
  category: string;

  @Column()
  protocol: string;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => ShopProduct, (shopProduct) => shopProduct.shop)
  shopProducts: ShopProduct[];
}
