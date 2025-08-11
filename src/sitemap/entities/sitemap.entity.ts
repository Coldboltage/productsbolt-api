import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Shop } from '../../shop/entities/shop.entity';

@Entity()
export class Sitemap {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ type: 'simple-array' })
  sitemapUrls: string[];

  @Column()
  shopifySite: boolean;

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
  errored: boolean;

  @OneToOne(() => Shop)
  shop: Shop;
}
