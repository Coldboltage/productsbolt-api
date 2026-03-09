import { Product } from 'src/product/entities/product.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ nullable: true })
  creator: string;

  @Column({ nullable: true })
  mainLogo: string;

  @OneToMany(() => Product, (product) => product.brand)
  products: Product[];
}
