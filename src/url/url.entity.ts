import { SitemapUrl } from 'src/sitemap-url/entities/sitemap-url.entity';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index(['sitemapUrl', 'url'], { unique: true })
export class Url {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column({ default: false })
  scanned: boolean;

  @Column({ default: true })
  freshUrl: boolean;

  @ManyToOne(() => SitemapUrl, (sitemapUrl) => sitemapUrl.urls, {
    onDelete: 'CASCADE',
  })
  sitemapUrl: SitemapUrl;
}
