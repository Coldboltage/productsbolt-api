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
  CheckPageDto,
  ProductToWebpageInterface,
  ProductToWebpageSlimInterface,
  StrippedWebpage,
  StrippedWebpageSlim,
  Webpage,
} from './entities/webpage.entity';
import { IsNull, Repository } from 'typeorm';
import { ShopProductService } from '../shop-product/shop-product.service';
import { ClientProxy } from '@nestjs/microservices';
import { ProductService } from '../product/product.service';
import { AlertService } from '../alert/alert.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class WebpageService {
  constructor(
    @InjectRepository(Webpage) private webpagesRepository: Repository<Webpage>,
    @Inject('HEADFUL_CLIENT') private headfulClient: ClientProxy,
    @Inject('HEADLESS_CLIENT') private readonly headlessClient: ClientProxy,
    private shopProductService: ShopProductService,
    private productService: ProductService,
    private alertService: AlertService,
  ) {}

  async onApplicationBootstrap() {
    // Force the client to connect so we can inspect it
    await this.headfulClient.connect();
    await this.headlessClient.connect();

    // Dig into the amqp-connection-manager instance
    const client: any = this.headfulClient;
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

    // Testing area
    // await this.nextProductToSell();
  }

  async create(createWebpageDto: CreateWebpageDto): Promise<Webpage> {
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
      console.error(
        `Page wasn't added ${createWebpageDto.url} as it's blacklisted for this ShopProduct`,
      );
      throw new ConflictException(
        'This webpage URL is blacklisted for the specified shop product.',
      );
    }

    shopProductEntity.populated = true;
    await this.shopProductService.update(shopProductEntity.id, {
      ...shopProductEntity,
    });
    entity.shopProduct = shopProductEntity;
    const webpageEntity = await this.webpagesRepository.save({
      ...entity,
      webpageCache: {},
    });
    console.log(`Page being created: ${createWebpageDto.url}`);
    console.log(webpageEntity);
    return webpageEntity;
  }

  async findAll(): Promise<Webpage[]> {
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
        webpageCache: true,
      },
    });
  }

  async findAllByProduct(productId: string): Promise<Webpage[]> {
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

  async findAllHighPriority(): Promise<Webpage[]> {
    return this.webpagesRepository.find({
      where: {
        shopProduct: {
          product: {
            priority: true,
          },
        },
      },
      relations: {
        shopProduct: {
          product: true,
          shop: true,
        },
        webpageCache: true,
      },
      order: {
        price: 'ASC',
      },
    });
  }

  async findAllNonHighPriority(): Promise<Webpage[]> {
    return this.webpagesRepository.find({
      where: {
        shopProduct: {
          product: {
            priority: false,
          },
        },
      },
      relations: {
        shopProduct: {
          product: true,
          shop: true,
        },
        webpageCache: true,
      },
      order: {
        price: 'ASC',
      },
    });
  }

  async findAllByProductStock(
    state: boolean,
    productId: string,
  ): Promise<Webpage[]> {
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
          product: {
            ebayStat: true,
          },
        },
      },
      order: {
        price: 'ASC',
      },
    });
  }

  async findAllWebpagesDividedByProduct(): Promise<
    ProductToWebpageInterface[]
  > {
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

  async findAllWebpagesDividedByProductsStockState(
    state: boolean,
  ): Promise<ProductToWebpageInterface[]> {
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

  async showAllWebpagesForAlert(id: string): Promise<Webpage[]> {
    const alertEntity = await this.findOne(id);
    return this.findAllByProduct(alertEntity.id);
  }

  async showProductsTrue(): Promise<StrippedWebpageSlim[]> {
    const alertsTriggered = await this.alertService.findAllState(true);
    // Alerts which are true are here. I can get the products now in question
    const productWebpages = [];
    for (const alert of alertsTriggered) {
      const webpages = await this.findAllByProductStock(true, alert.product.id);
      const strippedWebpages = webpages.map((webpage) => ({
        id: webpage.id,
        url: webpage.url,
        inStock: webpage.inStock,
        price: webpage.price,
        currencyCode: webpage.currencyCode,
      }));
      const productWebpagesObject = {
        name: alert.name,
        webpages: strippedWebpages,
      };
      productWebpages.push(productWebpagesObject);
    }
    return productWebpages;
  }

  async findAllWebpagesDividedByProductsStockStateSlim(
    state: boolean,
  ): Promise<ProductToWebpageSlimInterface[]> {
    console.log('fired findAllWebpagesDividedByProductsStockStateSlim');
    const products = await this.productService.findAll();
    const response: { productName: string; webPages: StrippedWebpageSlim[] }[] =
      [];
    for (const product of products) {
      const specificWebPagesForProduct = await this.findAllByProductStock(
        state,
        product.id,
      );
      if (specificWebPagesForProduct.length === 0) continue;
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

  async findAllWebpagesDividedByProductSlim(): Promise<
    ProductToWebpageSlimInterface[]
  > {
    const products = await this.productService.findAll();
    const response: { productName: string; webPages: StrippedWebpageSlim[] }[] =
      [];
    for (const product of products) {
      const specificWebPagesForProduct = await this.findAllByProduct(
        product.id,
      );
      if (specificWebPagesForProduct.length === 0) continue;
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

  async findAllWithoutCache() {
    return this.webpagesRepository.find({
      relations: {
        webpageCache: true,
      },
      where: {
        webpageCache: {
          id: IsNull(),
        },
      },
    });
  }

  @Cron(CronExpression.EVERY_2_HOURS, {
    name: 'updateAllPages',
  })
  async updateAllPages(): Promise<void> {
    // Already doing high priority every 5 minutes
    const webPages = await this.findAllNonHighPriority();
    console.log(webPages.length);
    for (const page of webPages) {
      console.log(page);
      const updatePageDto: CheckPageDto = {
        url: page.url,
        query: page.shopProduct.name,
        type: page.shopProduct.product.type,
        shopWebsite: page.shopProduct.shop.name,
        webPageId: page.id,
        shopifySite: page.shopProduct.shop.isShopifySite,
        hash: page.webpageCache.hash,
        confirmed: page.webpageCache.confirmed,
        count: page.webpageCache.count,
        cloudflare: page.shopProduct.shop.cloudflare,
      };
      if (page.shopProduct.shop.isShopifySite === true) {
        this.headlessClient.emit('updatePage', updatePageDto);
      } else if (page.shopProduct.shop.cloudflare === true) {
        this.headlessClient.emit('updatePage', updatePageDto);
      } else {
        this.headfulClient.emit('updatePage', updatePageDto);
      }
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'updateHighPriorityWebpages',
  })
  async updateHighPriorityWebpages(): Promise<void> {
    const webPages = await this.findAllHighPriority();
    console.log(webPages.length);
    for (const page of webPages) {
      const updatePageDto: CheckPageDto = {
        url: page.url,
        query: page.shopProduct.name,
        type: page.shopProduct.product.type,
        shopWebsite: page.shopProduct.shop.name,
        webPageId: page.id,
        shopifySite: page.shopProduct.shop.isShopifySite,
        hash: page.webpageCache.hash,
        confirmed: page.webpageCache.confirmed,
        count: page.webpageCache.count,
        cloudflare: page.shopProduct.shop.cloudflare,
      };
      if (page.shopProduct.shop.isShopifySite === true) {
        this.headlessClient.emit('updatePage', updatePageDto);
      } else if (page.shopProduct.shop.cloudflare === true) {
        this.headlessClient.emit('updatePage', updatePageDto);
      } else {
        this.headfulClient.emit('updatePage', updatePageDto);
      }
    }
  }

  async updatePage(webpageId: string): Promise<void> {
    const page = await this.findOne(webpageId);
    const updatePageDto: CheckPageDto = {
      url: page.url,
      query: page.shopProduct.name,
      type: page.shopProduct.product.type,
      shopWebsite: page.shopProduct.shop.name,
      webPageId: page.id,
      shopifySite: page.shopProduct.shop.isShopifySite,
      hash: page.webpageCache.hash,
      confirmed: page.webpageCache.confirmed,
      count: page.webpageCache.count,
      cloudflare: page.shopProduct.shop.cloudflare,
    };
    console.log(page);
    if (page.shopProduct.shop.isShopifySite === true) {
      this.headlessClient.emit('updatePage', updatePageDto);
    } else {
      this.headfulClient.emit('updatePage', updatePageDto);
    }
  }

  async findOne(id: string): Promise<Webpage> {
    return this.webpagesRepository.findOne({
      where: { id },
      relations: {
        shopProduct: {
          shop: true,
          product: true,
        },
        webpageCache: true,
      },
    });
  }

  async findOneByUrl(url: string): Promise<Webpage> {
    const entity = await this.webpagesRepository.findOne({
      where: { url },
      relations: { shopProduct: true },
    });
    return entity;
  }

  async update(
    id: string,
    updateWebpageDto: UpdateWebpageDto,
  ): Promise<Webpage> {
    console.log(id);
    await this.webpagesRepository.update(id, {
      price: updateWebpageDto.price ? updateWebpageDto.price : 0,
      inStock: updateWebpageDto.inStock,
    });
    const webpageEntity = await this.findOne(id);
    const result = await this.alertService.checkAlert(webpageEntity);
    if (result === true && webpageEntity.alertCount <= 5) {
      const count = webpageEntity.alertCount + 1;
      await this.webpagesRepository.update(webpageEntity.id, {
        alertCount: count,
      });
    } else if (result === true && webpageEntity.alertCount > 5) {
      await this.webpagesRepository.update(webpageEntity.id, {
        disable: true,
      });
    }

    return this.findOne(id);
  }

  async removeAllWebPages(): Promise<void> {
    const allWebpages = await this.findAll();
    for (const webpage of allWebpages) {
      await this.removeWebpage(webpage.id);
    }
  }

  async removeWebpage(id: string): Promise<boolean> {
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

  async remove(id: string): Promise<Webpage> {
    const webpageEntity = await this.findOne(id);
    return this.webpagesRepository.remove(webpageEntity);
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async resetAlertCount(): Promise<void> {
    const webpageEntities = await this.findAll();
    webpageEntities.forEach(
      (webpage) => ((webpage.alertCount = 3), (webpage.disable = false)),
    );
    await this.webpagesRepository.save(webpageEntities);
  }
}
