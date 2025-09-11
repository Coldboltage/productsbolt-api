import { Webpage } from 'src/webpage/entities/webpage.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class WebpageCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: false })
  confirmed: boolean;

  @Column({ default: 'abc' })
  hash: string;

  // When this hits 3, no more counting until new hash has emerged
  @Column({ default: 0 })
  count: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  date: Date;

  @OneToOne(() => Webpage, (webpage) => webpage.webpageCache, {
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  webpage: Webpage;
}
