import { CandidatePageCache } from 'src/candidate-page-cache/entities/candidate-page-cache.entity';
import { ShopProduct } from 'src/shop-product/entities/shop-product.entity';
import {
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Entity,
  ManyToOne,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['url', 'shopProduct'])
export class CandidatePage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column()
  inStock: boolean;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column()
  currencyCode: string;

  @Column()
  reason: string;

  @ManyToOne(() => ShopProduct, (shopProduct) => shopProduct.candidatePages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  shopProduct: ShopProduct;

  @Column({ default: false })
  disable: boolean;

  @Column({ default: 0 })
  alertCount: number;

  @Column({ default: '' })
  pageTitle: string;

  @Column({ default: '' })
  pageAllText: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastScanned: Date;

  @Column({ nullable: true, default: null })
  variantId: null | string;

  @Column({ default: false })
  priceCheck: boolean;

  @Column({ default: false })
  editionMatch: boolean;

  @Column({ default: false })
  inspected: boolean;

  @Column({ default: false })
  packagingTypeMatch: boolean;

  @Column({ default: false })
  inspecpackagingTypeMatchted: boolean;

  @Column({ default: false })
  loadedData: boolean;

  @Column({ default: false })
  hasMixedSignals: boolean;

  @OneToOne(
    () => CandidatePageCache,
    (candidatePageCache) => candidatePageCache.candidatePage,
    {
      cascade: ['insert', 'update'],
    },
  )
  candidatePageCache: CandidatePageCache;
}
