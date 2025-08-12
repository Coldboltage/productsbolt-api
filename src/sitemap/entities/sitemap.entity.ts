import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Shop } from '../../shop/entities/shop.entity';

@Entity()
@Unique(['shop', 'id'])
export class Sitemap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sitemap: string;

  @Column({ type: 'simple-array', default: '' })
  sitemapUrls: string[];

  @Column()
  isShopifySite: boolean;

  @Column({ default: false })
  collections: boolean;

  /**
   * True if the sitemap could not be fetched or processed
   * (e.g., 429 errors, invalid XML, connection issues).
   * Used to skip or retry problematic sites.
   */
  @Column({
    comment:
      'Marks sitemaps that failed to process, e.g., 429 errors or invalid XML',
    default: false,
  })
  error: boolean;

  @Column({ default: true })
  manual: boolean;

  @Column({ default: false })
  fast: boolean;

  @OneToOne(() => Shop, (shop) => shop.sitemapEntity, {
    onDelete: 'CASCADE',
  })
  // @JoinColumn({ name: 'shop_id' })
  @JoinColumn()
  shop: Shop;
}
