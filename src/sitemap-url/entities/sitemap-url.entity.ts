import { Sitemap } from 'src/sitemap/entities/sitemap.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class SitemapUrl {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'simple-array', default: '' })
  urls: string[];

  @OneToOne(() => Sitemap, (sitemap) => sitemap.sitemapUrl, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  sitemap: Sitemap;
}
