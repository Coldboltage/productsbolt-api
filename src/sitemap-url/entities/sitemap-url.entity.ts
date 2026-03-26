import { Sitemap } from 'src/sitemap/entities/sitemap.entity';
import { Url } from 'src/url/url.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['sitemap'])
export class SitemapUrl {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => Url, (url) => url.sitemapUrl)
  urls: Url[];
  // @Column({ type: 'simple-array', default: '' })
  // urls: string[];

  @Column({ type: 'simple-array', default: '' })
  backupUrls: string[];

  @Column({ type: 'simple-array', default: '' })
  freshUrls: string[];

  @OneToOne(() => Sitemap, (sitemap) => sitemap.sitemapUrl, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  sitemap: Sitemap;
}
