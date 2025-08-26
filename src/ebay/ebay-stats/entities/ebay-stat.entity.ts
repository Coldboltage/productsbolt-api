import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class EbayStat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
