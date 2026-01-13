import { ConflictException, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository, UpdateResult } from 'typeorm';
import { Product } from './entities/product.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private productsRepository: Repository<Product>,
    private eventEmitter: EventEmitter2,
  ) {}
  async create(createProductDto: CreateProductDto): Promise<Product> {
    let entity: Product;
    try {
      entity = await this.productsRepository.save(createProductDto);
    } catch (error) {
      throw new ConflictException('product_and_type_combo_found');
    }
    this.eventEmitter.emit('product.created', entity);
    return entity;
  }

  async findOneByProductName(productName: string): Promise<Product> {
    return this.productsRepository.findOne({
      where: {
        name: productName,
      },
    });
  }

  async findAll(): Promise<Product[]> {
    const allProducts = await this.productsRepository.find({
      relations: { ebayStat: true },
    });
    return allProducts;
  }

  async findOne(id: string): Promise<Product> {
    return this.productsRepository.findOne({
      where: { id },
      relations: { ebayStat: true },
    });
  }

  async findAllWithEbayStat(): Promise<Product[]> {
    return this.productsRepository.find({
      relations: {
        ebayStat: true,
      },
      where: { ebayStat: { id: Not(IsNull()) } }, // generates "ebayStat.id IS NOT NULL"
    });
  }

  async findOneWithEbayStat(id: string): Promise<Product> {
    return this.productsRepository.findOne({
      where: {
        id,
      },
      relations: {
        ebayStat: true,
      },
    });
  }

  update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<UpdateResult> {
    return this.productsRepository.update(id, updateProductDto);
  }

  async remove(id: string): Promise<Product> {
    const productEntity = await this.findOne(id);
    return this.productsRepository.remove(productEntity);
  }
}
