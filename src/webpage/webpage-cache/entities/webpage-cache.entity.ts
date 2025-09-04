import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

Entity()
export class WebpageCache {
  @PrimaryGeneratedColumn('uuid')
  string: string

  @Column({default: false})
  confirmed: boolean;

  @Column({default: ""})
  hash: string;

  @Column({type: 'date'})
  date: Date
}
