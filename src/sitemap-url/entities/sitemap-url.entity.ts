import { Sitemap } from 'src/sitemap/entities/sitemap.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['sitemap'])
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
