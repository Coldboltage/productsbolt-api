import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(['baseCurrency', 'comparedCurrency'])
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  baseCurrency: string;

  @Column()
  comparedCurrency: string;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 10,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => Number(v),
    },
  })
  value: number;
}

export type ExchangeRatesResponse = {
  data: Record<string, number>;
};
