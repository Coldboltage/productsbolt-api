import { Shop } from 'src/shop/entities/shop.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ShopListing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  listingName: string;

  @Column()
  listingUrl: string;

  @Column()
  price: string;

  @ManyToOne(() => Shop, (shop) => shop.shopListings)
  shop: Shop;
}

export interface ShopListingInterface {
  listingName: string;
  linkListing: string;
  listingPrice: string;
}
