import { ConflictException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private productsRepository: Repository<Product>,
    private eventEmitter: EventEmitter2,
  ) {}
  async create(createProductDto: CreateProductDto) {
    let entity: Product;
    try {
      entity = await this.productsRepository.save(createProductDto);
    } catch (error) {
      throw new ConflictException('product_and_type_combo_found');
    }
    this.eventEmitter.emit('product.created', entity);
    return entity;
  }

  async findOneByProductName(productName: string) {
    return this.productsRepository.findOne({
      where: {
        name: productName,
      },
    });
  }

  async findAll() {
    const allProducts = await this.productsRepository.find({});
    return allProducts;
  }

  findOne(id: string) {
    return this.productsRepository.findOne({
      where: { id },
    });
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
