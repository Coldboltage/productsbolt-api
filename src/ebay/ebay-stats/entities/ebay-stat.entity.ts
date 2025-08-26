import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../../product/entities/product.entity';

@Entity()
export class EbayStat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Product, (product) => product.ebayStat)
  @JoinColumn()
  product: Product;

  @Column('decimal', { nullable: true })
  minPrice: number;

  @Column('decimal', { nullable: true })
  averagePrice: number;

  @Column('decimal', { nullable: true })
  maxPrice: number;

  // cached strategy prices (optional)
  @Column('decimal', { nullable: true })
  jitPrice: number;

  @Column('decimal', { nullable: true })
  clearPrice: number;

  @Column('decimal', { nullable: true })
  maximisedPrice: number;
}
