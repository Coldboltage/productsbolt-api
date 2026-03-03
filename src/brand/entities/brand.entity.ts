import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Brand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  urlSafeName: string;

  @Column()
  name: string;

  @Column()
  description: string;
}
