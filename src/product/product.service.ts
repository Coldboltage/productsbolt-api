import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository, UpdateResult } from 'typeorm';
import { Product, ProductStripped } from './entities/product.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BrandService } from 'src/brand/brand.service';

@Injectable()
export class ProductService {
  private logger = new Logger(ProductService.name);
  constructor(
    @InjectRepository(Product) private productsRepository: Repository<Product>,
    private eventEmitter: EventEmitter2,
    private brandService: BrandService,
  ) {}
  async create(createProductDto: CreateProductDto): Promise<Product> {
    let entity: Product;
    try {
      const brandEntity = await this.brandService.findOne(
        createProductDto.brandId,
      );
      entity = await this.productsRepository.save({
        ...createProductDto,
        brand: brandEntity,
      });
    } catch (error) {
      this.logger.error(error);
      throw new ConflictException('product_and_type_combo_found');
    }
    this.eventEmitter.emit('product.created', entity);
    return entity;
  }

  async findOneByProductName(urlSafeName: string): Promise<Product> {
    return this.productsRepository.findOne({
      where: {
        urlSafeName,
      },
    });
  }

  async findAll(): Promise<Product[]> {
    const allProducts = await this.productsRepository.find({
      relations: { ebayStat: true },
    });
    return allProducts;
  }

  async findAllProductsOnly(): Promise<Product[]> {
    const allProducts = await this.productsRepository.find({
      select: {
        id: true,
        name: true,
        brand: true,
        urlSafeName: true,
        imageUrl: true,
        releaseDate: true,
        updatedLast: true,
      },
      order: {
        releaseDate: 'DESC',
      },
    });
    return allProducts;
  }

  async findProductsByBrand(brand: string): Promise<Product[]> {
    const allProducts = await this.productsRepository.find({
      where: {
        brand: {
          urlSafeName: brand,
        },
      },
      relations: {
        brand: true,
      },
      select: {
        id: true,
        name: true,
        brand: true,
        urlSafeName: true,
        imageUrl: true,
        releaseDate: true,
      },
      order: {
        releaseDate: 'DESC',
      },
    });
    console.log(allProducts);
    return allProducts;
  }

  async findProductsByBrandWithWebPages(
    brand: string,
  ): Promise<ProductStripped[]> {
    const allProducts = await this.productsRepository.find({
      where: {
        brand: {
          urlSafeName: brand,
        },
        shopProducts: {
          populated: true,
          webPage: {
            inStock: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        brand: true,
        urlSafeName: true,
        imageUrl: true,
        releaseDate: true,
      },
      relations: {
        shopProducts: {
          webPage: true,
        },
        brand: true,
      },
      order: {
        releaseDate: 'DESC',
      },
    });
    const onlyProducts = allProducts.map((product) => {
      const onlyProduct: ProductStripped = {
        id: product.id,
        name: product.name,
        brand: product.brand.name,
        urlSafeName: product.urlSafeName,
        imageUrl: product.imageUrl,
        releaseDate: product.releaseDate,
      };

      return onlyProduct;
    });
    return onlyProducts;
  }

  async findOne(id: string): Promise<Product> {
    return this.productsRepository.findOne({
      where: { id },
      relations: { ebayStat: true },
    });
  }

  async findOneByUrlSafeName(urlSafeName: string): Promise<Product> {
    return this.productsRepository.findOne({
      where: { urlSafeName },
      relations: { ebayStat: true },
    });
  }

  async findOneByProductSafeName(productName: string): Promise<Product> {
    return this.productsRepository.findOne({
      where: {
        urlSafeName: productName,
        shopProducts: { shop: { active: true } },
      },
      relations: { ebayStat: true, brand: true, shopProducts: { shop: true } },
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

  async updatePageForSite(productId: string) {
    const productEntity = await this.findOne(productId);
    console.log(productEntity);
    await fetch(
      `${process.env.WEBSITE_URL}/api/revalidate?secret=${process.env.WEBSITE_SECRET}&productName=${productEntity.urlSafeName}`,
      { method: 'POST' },
    );
  }

  async updatePageForSiteSafeName(urlSafeName: string) {
    const productEntity = await this.findOneByUrlSafeName(urlSafeName);
    console.log(productEntity);
    await fetch(
      `${process.env.WEBSITE_URL}/api/revalidate?secret=${process.env.WEBSITE_SECRET}&productName=${productEntity.urlSafeName}`,
      { method: 'POST' },
    );
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
