import { Webpage } from "src/webpage/entities/webpage.entity";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

Entity()
export class WebpageCache {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({default: false})
  confirmed: boolean;

  @Column({default: ""})
  hash: string;

  // When this hits 3, no more counting until new hash has emerged
  @Column({ default: 0})
  count: number

  @Column({type: 'date'})
  date: Date

  @OneToOne(() => Webpage, (webpage) => webpage.webpageCache, {cascade: ['insert', 'update']})
  @JoinColumn()
  webpage: Webpage
}
