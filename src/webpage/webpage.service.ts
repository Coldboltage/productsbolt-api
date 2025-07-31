import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWebpageDto } from './dto/create-webpage.dto';
import { UpdateWebpageDto } from './dto/update-webpage.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  StrippedWebpage,
  StrippedWebpageSlim,
  Webpage,
} from './entities/webpage.entity';
import { Repository } from 'typeorm';
import { ShopProductService } from '../shop-product/shop-product.service';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProductService } from '../product/product.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WebpageService {
  constructor(
    @InjectRepository(Webpage) private webpagesRepository: Repository<Webpage>,
    @Inject('PROCESS_CLIENT') private processClient: ClientProxy,
    @Inject('MISC_CLIENT') private readonly miscClient: ClientProxy,
    private shopProductService: ShopProductService,
    private productService: ProductService,
    private eventEmitter: EventEmitter2,
  ) { }

  async onApplicationBootstrap() {
    // Force the client to connect so we can inspect it
    await this.processClient.connect();

    // Dig into the amqp-connection-manager instance
    const client: any = this.processClient;
    const managers = client.client; // the amqp-connection-manager Client
    const manager =
      managers as import('amqp-connection-manager').AmqpConnectionManager;

    // Listen for when it actually connects to the broker
    manager.on('connect', ({ url }) => {
      console.log('✅ Client connected to', url);
    });
    manager.on('disconnect', (params) => {
      console.log('❌ Client disconnected', params.err.message);
    });

    // Inspect the asserted queue options
    console.log('Client queueOptions:', client.options.queueOptions);
  }

  async create(createWebpageDto: CreateWebpageDto) {
    const checkForExistanceEntity = await this.findOneByUrl(
      createWebpageDto.url,
    );

    if (checkForExistanceEntity) {
      console.error('Webpage already exists elsewhere');
      throw new ConflictException({
        statusCode: 409,
        error: 'Webpage URL Conflict',
        message: 'Webpage already exists',
        details: {
          field: 'url',
          value: `${createWebpageDto.url}`,
          suggestion:
            'The webpage already exists therefore it is already assiocated to another product',
        },
      });
    }

    const entity = this.webpagesRepository.create(createWebpageDto);
    const shopProductEntity = await this.shopProductService.findOneByProductId(
      createWebpageDto.productId,
      createWebpageDto.shopId,
    );

    console.log(shopProductEntity);
    if (shopProductEntity.populated === true) {
      console.error('WebPage exists for shopProduct');

      throw new ConflictException({
        statusCode: 409,
        error: 'Webpage URL Conflict',
        message: 'WebPage exists for shopProduct',
        details: {
          field: 'url',
          value: `${createWebpageDto.url}`,
          suggestion:
            'Check if the URL that exists should be for the shopProduct. Dumb Bot',
        },
      });
    }

    if (
      await this.shopProductService.isUrlBlacklistedForShopProduct(
        createWebpageDto.url,
        shopProductEntity.id,
      )
    ) {
      console.error(`Page wasn't added ${createWebpageDto.url}`);
      throw new ConflictException(
        'This webpage URL is blacklisted for the specified shop product.',
      );
    }

    shopProductEntity.populated = true;
    await this.shopProductService.update(shopProductEntity.id, {
      ...shopProductEntity,
    });
    entity.shopProduct = shopProductEntity;
    const webpageEntity = await this.webpagesRepository.save(entity);
    console.log(`Page being created: ${createWebpageDto.url}`);
    console.log(webpageEntity);
    this.eventEmitter.emit('webpage.updated', webpageEntity);
    return webpageEntity;
  }

  async findAll() {
    return this.webpagesRepository.find({
      order: {
        price: 'ASC',
      },
      where: {},
      relations: {
        shopProduct: {
          product: true,
          shop: true,
        },
      },
    });
  }

  async findAllByProduct(productId: string) {
    console.log(productId);
    return this.webpagesRepository.find({
      where: {
        shopProduct: {
          product: {
            id: productId,
          },
        },
      },
      relations: {
        shopProduct: {
          product: true,
        },
      },
      order: {
        price: 'ASC',
      },
    });
  }

  async findAllByProductStock(state: boolean, productId: string) {
    return this.webpagesRepository.find({
      where: {
        shopProduct: {
          product: {
            id: productId,
          },
        },
        inStock: state,
      },
      relations: {
        shopProduct: {
          product: true,
        },
      },
      order: {
        price: 'ASC',
      },
    });
  }

  async findAllWebpagesDividedByProduct() {
    const products = await this.productService.findAll();
    const response: { productName: string; webPages: StrippedWebpage[] }[] = [];
    for (const product of products) {
      const specificWebPagesForProduct = await this.findAllByProduct(
        product.id,
      );
      const strippedWebpages = specificWebPagesForProduct.map((webpage) => ({
        id: webpage.id,
        url: webpage.url,
        inStock: webpage.inStock,
        price: webpage.price,
        currencyCode: webpage.currencyCode,
        reason: webpage.reason,
      }));
      response.push({
        productName: product.name,
        webPages: strippedWebpages,
      });
    }
    console.log(response[0].webPages.length);
    return response;
  }

  async findAllWebpagesDividedByProductsStockState(state: boolean) {
    const products = await this.productService.findAll();
    const response: { productName: string; webPages: StrippedWebpage[] }[] = [];
    for (const product of products) {
      const specificWebPagesForProduct = await this.findAllByProductStock(
        state,
        product.id,
      );
      const strippedWebpages = specificWebPagesForProduct.map((webpage) => ({
        id: webpage.id,
        url: webpage.url,
        inStock: webpage.inStock,
        price: webpage.price,
        currencyCode: webpage.currencyCode,
        reason: webpage.reason,
      }));
      response.push({
        productName: product.name,
        webPages: strippedWebpages,
      });
    }
    console.log(response[0].webPages.length);
    return response;
  }

  async findAllWebpagesDividedByProductsStockStateSlim(state: boolean) {
    const products = await this.productService.findAll();
    const response: { productName: string; webPages: StrippedWebpageSlim[] }[] =
      [];
    for (const product of products) {
      const specificWebPagesForProduct = await this.findAllByProductStock(
        state,
        product.id,
      );
      const strippedWebpages = specificWebPagesForProduct.map((webpage) => ({
        id: webpage.id,
        url: webpage.url,
        inStock: webpage.inStock,
        price: webpage.price,
        currencyCode: webpage.currencyCode,
      }));
      response.push({
        productName: product.name,
        webPages: strippedWebpages,
      });
    }
    console.log(response[0].webPages.length);
    return response;
  }

  async findAllWebpagesDividedByProductSlim() {
    const products = await this.productService.findAll();
    const response: { productName: string; webPages: StrippedWebpageSlim[] }[] =
      [];
    for (const product of products) {
      const specificWebPagesForProduct = await this.findAllByProduct(
        product.id,
      );
      const strippedWebpages = specificWebPagesForProduct.map((webpage) => ({
        id: webpage.id,
        url: webpage.url,
        inStock: webpage.inStock,
        price: webpage.price,
        currencyCode: webpage.currencyCode,
      }));
      response.push({
        productName: product.name,
        webPages: strippedWebpages,
      });
    }
    console.log(response[0].webPages.length);
    return response;
  }

  // @Cron(CronExpression.EVERY_HOUR)
  async updateAllPages() {
    const webPages = await this.findAll();
    console.log(webPages.length);
    for (const page of webPages) {
      console.log(page);
      this.processClient.emit('updatePage', {
        url: page.url,
        query: page.shopProduct.name,
        type: page.shopProduct.product.type,
        shopWebsite: page.shopProduct.shop.name,
        webPageId: page.id,
        shopifySite: page.shopProduct.shop.isShopifySite,
      });
    }
    return webPages;
  }

  async updatePage(webpageId) {
    const page = await this.findOne(webpageId);

    console.log(page);
    this.processClient.emit('updatePage', {
      url: page.url,
      query: page.shopProduct.name,
      type: page.shopProduct.product.type,
      shopWebsite: page.shopProduct.shop.name,
      webPageId: page.id,
      shopifySite: page.shopProduct.shop.isShopifySite,
    });

    return page;
  }

  async findOne(id: string) {
    return this.webpagesRepository.findOne({
      where: { id },
      relations: {
        shopProduct: {
          shop: true,
          product: true,
        },
      },
    });
  }

  async findOneByUrl(url: string) {
    const entity = await this.webpagesRepository.findOne({
      where: { url },
      relations: { shopProduct: true },
    });
    return entity;
  }

  async update(id: string, updateWebpageDto: UpdateWebpageDto) {
    console.log(id);
    await this.webpagesRepository.update(id, {
      price: updateWebpageDto.price,
      inStock: updateWebpageDto.inStock,
    });
    const webpageEntity = await this.findOne(id);
    this.eventEmitter.emit('webpage.updated', webpageEntity);

    return this.findOne(id);
  }

  async removeWebpage(id: string) {
    console.log(id);
    const webpage = await this.webpagesRepository.findOne({
      where: { id },
      relations: ['shopProduct'],
    });
    if (!webpage) throw new NotFoundException('Webpage not found');

    // Update associated shopProduct
    if (webpage.shopProduct) {
      webpage.shopProduct.populated = false;
      await this.shopProductService.update(
        webpage.shopProduct.id,
        webpage.shopProduct,
      );
    }
    await this.remove(webpage.id);
    return true;
  }

  async remove(id: string) {
    return this.webpagesRepository.delete({ id });
  }
}
