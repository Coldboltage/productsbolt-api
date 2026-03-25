import { SitemapUrl } from 'src/sitemap-url/entities/sitemap-url.entity';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index(['url', 'id'])
export class Url {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @ManyToOne(() => SitemapUrl, (sitemapUrl) => sitemapUrl.urls)
  sitemapUrl: SitemapUrl;
}
