import { CandidatePage } from 'src/candidate-page/entities/candidate-page.entity';
import { PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';

export class CandidatePageCache {
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

  @OneToOne(
    () => CandidatePage,
    (candidatePage) => candidatePage.candidatePageCache,
    {
      cascade: ['insert', 'update'],
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn()
  candidatePage: CandidatePage;
}
