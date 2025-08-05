import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { Webpage } from '../../webpage/entities/webpage.entity';

@Entity()
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // @ManyToOne(() => User, (user) => user.alerts)
  // user: User;

  @ManyToOne(() => Product, (product) => product.alerts)
  product: Product;

  @Column()
  price: number;

  @Column({ default: false })
  alerted: boolean;
}

export interface ProductWebpagesInterface {
  name: string;
  webpages: Webpage[];
}
