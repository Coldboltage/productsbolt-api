import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ShopProduct } from '../../shop-product/entities/shop-product.entity';

@Entity()
export class BlackListUrl {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @ManyToMany(() => ShopProduct, (shopProduct) => shopProduct.blacklistUrls)
  @JoinTable() // Owning side
  shopProducts: ShopProduct[];
}
