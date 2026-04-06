import { Webpage } from 'src/webpage/entities/webpage.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index(['webpage', 'createdAt'])
export class WebpageSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column()
  inStock: boolean;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  euroPrice: number;

  @Column()
  currencyCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Webpage, (webpage) => webpage.webpageSnapshots, {
    onDelete: 'CASCADE',
  })
  webpage: Webpage;
}
