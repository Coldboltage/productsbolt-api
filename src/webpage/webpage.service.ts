import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateWebpageDto } from './dto/create-webpage.dto';
import { UpdateWebpageDto } from './dto/update-webpage.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CheckPageDto,
  FullCheckPageDtoPayloadDto,
  ProductToWebpageInterface,
  ProductToWebpageSlimInterface,
  ProductToWebpageSlimInterfaceMinimal,
  StrippedWebpage,
  StrippedWebpageSlim,
  StrippedWebpageSlimWithShop,
  StrippedWebpageSlimWithShopMinimal,
  Webpage,
} from './entities/webpage.entity';
import { IsNull, LessThanOrEqual, Not, Repository } from 'typeorm';
import { ShopProductService } from '../shop-product/shop-product.service';
import { ClientProxy } from '@nestjs/microservices';
import { ProductService } from '../product/product.service';
import { AlertService } from '../alert/alert.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Span } from 'nestjs-otel';
import { ShopService } from 'src/shop/shop.service';
import { ShopProduct } from 'src/shop-product/entities/shop-product.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CurrencyService } from 'src/currency/currency.service';
import { UtilsService } from 'src/utils/utils.service';
import { Url } from 'src/url/url.entity';
import { WebpageSnapshot } from 'src/webpage-snapshot/entities/webpage-snapshot.entity';

@Injectable()
export class WebpageService {
  private readonly logger = new Logger(WebpageService.name);

  constructor(
    @InjectRepository(Webpage) private webpagesRepository: Repository<Webpage>,
    @InjectRepository(Url) private urlsRepository: Repository<Url>,
    @InjectRepository(WebpageSnapshot)
    private webpageSnapshotRepository: Repository<WebpageSnapshot>,
    @Inject('HEADFUL_CLIENT') private headfulClient: ClientProxy,
    @Inject('HEADFUL_SLOW_CLIENT') private headfulSlowClient: ClientProxy,
    @Inject('HEADLESS_BROWSER_CLIENT')
    private headlessBrowserClient: ClientProxy,
    @Inject('HEADLESS_CLIENT') private readonly headlessClient: ClientProxy,
    private shopProductService: ShopProductService,
    private productService: ProductService,
    private alertService: AlertService,
    private shopService: ShopService,
    private currencyService: CurrencyService,
    private eventEmitter: EventEmitter2,
    private utilService: UtilsService,
  ) {}

  async onApplicationBootstrap() {
    // Force the client to connect so we can inspect it
    await this.headfulClient.connect();
    await this.headlessClient.connect();
    await this.headfulClient.connect();

    // Dig into the amqp-connection-manager instance
    const client: any = this.headfulClient;
    const managers = client.client; // the amqp-connection-manager Client
    const manager =
      managers as import('amqp-connection-manager').AmqpConnectionManager;

    // Listen for when it actually connects to the broker
    manager.on('connect', ({ url }) => {
      this.logger.log('✅ Client connected to', url);
    });
    manager.on('disconnect', (params) => {
      this.logger.log('❌ Client disconnected', params.err.message);
    });

    // Inspect the asserted queue options
    this.logger.log('Client queueOptions:', client.options.queueOptions);

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

    this.logger.log(shopProductEntity);
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
    entity.euroPrice = await this.currencyService.updateEuroPriceForOne(
      createWebpageDto.price,
      shopProductEntity.shop.currency,
    );

    const tolerance = 0.45;

    this.logger.log({
      euroPrice: entity.euroPrice,
      tolerance,
      expectedPrice: shopProductEntity.product.price,
    });

    const unit =
      Math.abs(entity.euroPrice - shopProductEntity.product.price) /
      shopProductEntity.product.price;
    const priceInRange = unit <= tolerance;

    this.logger.log(`princeInRange = ${priceInRange}`);

    const webpageEntity = await this.webpagesRepository.save({
      ...entity,
      priceCheck: priceInRange,
      webpageCache: {},
    });

    await this.webpageSnapshotRepository.save({
      ...entity,
      date: new Date(),
      webpage: webpageEntity,
    });

    this.logger.log('Website Revalidate');

    const productId = webpageEntity.shopProduct.productId;
    const productName = webpageEntity.shopProduct.product.urlSafeName;

    if (webpageEntity.priceCheck || webpageEntity.inspected) {
      await fetch(
        `${process.env.WEBSITE_URL}/api/revalidate?secret=${process.env.WEBSITE_SECRET}&productName=${productName}`,
        { method: 'POST' },
      );

      console.log(
        `${process.env.WEBSITE_URL}/api/revalidate?secret=${process.env.WEBSITE_SECRET}&productId=${productId}`,
      );
    }

    this.logger.log(`Page being created: ${createWebpageDto.url}`);
    this.logger.log(webpageEntity);
    if (shopProductEntity.candidatePages) {
      await this.shopProductService.removeCandidatePageFromShopProduct(
        webpageEntity.url,
      );
    }

    return webpageEntity;
  }

  async findAll(): Promise<Webpage[]> {
    return this.webpagesRepository.find({
      order: {
        price: 'ASC',
      },
      where: { shopProduct: { shop: { active: true } } },
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
    this.logger.log(productId);
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
        notFoundCounter: LessThanOrEqual(3),
        shopProduct: {
          shop: {
            active: true,
            cloudflareEnhanced: false,
          },
          product: {
            priority: true,
          },
        },
      },
      relations: {
        shopProduct: {
          product: true,
          shop: {
            sitemapEntity: true,
          },
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
        notFoundCounter: LessThanOrEqual(3),
        shopProduct: {
          shop: {
            active: true,
            cloudflareEnhanced: false,
          },
          product: {
            priority: false,
          },
        },
      },
      relations: {
        shopProduct: {
          product: true,
          shop: {
            sitemapEntity: true,
          },
        },
        webpageCache: true,
      },
      order: {
        price: 'ASC',
      },
    });
  }

  @Span('WebpageService.findAllByProductStock')
  async findAllByProductStock(
    state: boolean,
    productId: string,
  ): Promise<Webpage[]> {
    return this.webpagesRepository.find({
      where: {
        notFoundCounter: LessThanOrEqual(3),
        shopProduct: {
          shop: {
            active: true,
          },
          product: {
            id: productId,
          },
        },
        inStock: state,
        price: Not(0),
        euroPrice: Not(0),
      },
      relations: {
        shopProduct: {
          shop: true,
          product: {
            ebayStat: true,
          },
        },
      },
      order: {
        euroPrice: 'ASC',
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
    this.logger.log(response[0].webPages.length);
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
    this.logger.log(response[0].webPages.length);
    return response;
  }

  async findPageToBeInspected(inspected = false) {
    const raw = await this.webpagesRepository
      .createQueryBuilder('page')
      .select('page.id', 'id')
      .innerJoin('page.shopProduct', 'sp')
      .innerJoin('sp.shop', 'shop')
      .where('page.inspected = :inspected', { inspected })
      .andWhere('shop.active = true')
      .orderBy('RANDOM()')
      .limit(1)
      .getRawOne<{ id: string }>();

    if (!raw?.id) return null;

    const webpageEntity = await this.webpagesRepository.findOne({
      where: { id: raw.id },
      relations: {
        shopProduct: true,
      },
    });

    await this.webpagesRepository.update(webpageEntity.id, { inspected: true });

    return webpageEntity;
  }

  async showAllWebpagesForAlert(id: string): Promise<Webpage[]> {
    const alertEntity = await this.findOne(id);
    return this.findAllByProduct(alertEntity.id);
  }

  @Span('WebpageService.showProductsTrue')
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

  async findAllWebpagesDividedByProductIdStockStateSlim(
    state: boolean,
    productId: string,
  ): Promise<ProductToWebpageSlimInterface> {
    this.logger.log('fired findAllWebpagesDividedByProductIdStockStateSlim');
    const product = await this.productService.findOne(productId);
    const response: { productName: string; webPages: StrippedWebpageSlim[] }[] =
      [];

    const specificWebPagesForProduct = await this.findAllByProductStock(
      state,
      product.id,
    );
    if (specificWebPagesForProduct.length === 0)
      throw new NotFoundException('no_webpages_found_for_product');
    const strippedWebpages = specificWebPagesForProduct.map((webpage) => ({
      id: webpage.id,
      url: webpage.url,
      inStock: webpage.inStock,
      price: webpage.price,
      currencyCode: webpage.currencyCode,
      shop: webpage.shopProduct.shop.name,
    }));
    response.push({
      productName: product.name,
      webPages: strippedWebpages,
    });

    this.logger.log(response[0].webPages.length);
    return response[0];
  }

  async findAllWebpagesDividedByProductNameStockStateSlim(
    state: boolean,
    productName: string,
  ): Promise<ProductToWebpageSlimInterface> {
    console.log({ state, productName });
    this.logger.log('fired findAllWebpagesDividedByProductNameStockStateSlim');
    const product =
      await this.productService.findOneByProductSafeName(productName);
    const response: {
      productName: string;
      productImage: string;
      webPages: StrippedWebpageSlim[];
    }[] = [];

    const specificWebPagesForProduct = await this.findAllByProductStock(
      state,
      product.id,
    );
    if (specificWebPagesForProduct.length === 0)
      throw new NotFoundException('no_webpages_found_for_product');
    const strippedWebpages = specificWebPagesForProduct.map((webpage) => ({
      id: webpage.id,
      url: webpage.url,
      inStock: webpage.inStock,
      price: webpage.price,
      currencyCode: webpage.currencyCode,
      shop: webpage.shopProduct.shop.name,
    }));
    response.push({
      productName: product.name,
      productImage: product.imageUrl,
      webPages: strippedWebpages,
    });

    this.logger.log(response[0].webPages.length);
    return response[0];
  }

  async findAllWebpagesDividedByProductsStockStateShopInfoSlim(
    state: boolean,
    productName: string,
  ): Promise<ProductToWebpageSlimInterface> {
    console.log({ state, productName });
    this.logger.log('fired findAllWebpagesDividedByProductNameStockStateSlim');
    const product =
      await this.productService.findOneByProductSafeName(productName);
    const response: {
      productName: string;
      productImage: string;
      productBrand: string;
      productUrlSafeName: string;
      webPages: StrippedWebpageSlimWithShop[];
    }[] = [];

    console.log(product);

    const specificWebPagesForProduct = await this.findAllByProductStock(
      state,
      product.id,
    );
    if (specificWebPagesForProduct.length === 0)
      throw new NotFoundException('no_webpages_found_for_product');
    const strippedWebpageSlimWithShop = specificWebPagesForProduct
      .filter((webpage) => {
        return webpage.inspected === true || webpage.priceCheck === true;
      })
      .map((webpage) => ({
        id: webpage.id,
        url: webpage.url,
        inStock: webpage.inStock,
        price: webpage.price,
        euroPrice: webpage.euroPrice,
        currencyCode: webpage.currencyCode,
        shop: {
          name: webpage.shopProduct.shop.name,
          city: webpage.shopProduct.shop.city,
          province: webpage.shopProduct.shop.province,
          country: webpage.shopProduct.shop.country,
          currency: webpage.shopProduct.shop.currency,
          vatShown: webpage.shopProduct.shop.vatShown,
        },
      }));
    response.push({
      productName: product.name,
      productImage: product.imageUrl,
      productBrand: product.brand.name,
      productUrlSafeName: product.brand.urlSafeName,
      webPages: strippedWebpageSlimWithShop,
    });

    this.logger.log(response[0].webPages.length);
    return response[0];
  }

  async findAllWebpagesDividedByProductsStockStateShopInfoSlimMinimal(
    state: boolean,
    productName: string,
  ): Promise<ProductToWebpageSlimInterfaceMinimal> {
    console.log({ state, productName });
    this.logger.log('fired findAllWebpagesDividedByProductNameStockStateSlim');
    const product =
      await this.productService.findOneByProductSafeName(productName);
    const response: {
      productName: string;
      productImage: string;
      productBrand: string;
      productUrlSafeName: string;
      webPages: StrippedWebpageSlimWithShopMinimal[];
    }[] = [];

    console.log(product);

    const specificWebPagesForProduct = await this.findAllByProductStock(
      state,
      product.id,
    );
    if (specificWebPagesForProduct.length === 0)
      throw new NotFoundException('no_webpages_found_for_product');
    const strippedWebpageSlimWithShop = specificWebPagesForProduct
      .filter((webpage) => {
        return webpage.inspected === true || webpage.priceCheck === true;
      })
      .map((webpage) => ({
        inStock: webpage.inStock,
        price: webpage.price,
        euroPrice: webpage.euroPrice,
        currencyCode: webpage.currencyCode,
      }));
    response.push({
      productName: product.name,
      productImage: product.imageUrl,
      productBrand: product.brand.name,
      productUrlSafeName: product.brand.urlSafeName,
      webPages: strippedWebpageSlimWithShop,
    });

    this.logger.log(response[0].webPages.length);
    return response[0];
  }

  async findAllWebpagesDividedByProductsStockStateSlim(
    state: boolean,
  ): Promise<ProductToWebpageSlimInterface[]> {
    this.logger.log('fired findAllWebpagesDividedByProductsStockStateSlim');
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
    this.logger.log(response[0].webPages.length);
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
    this.logger.log(response[0].webPages.length);
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

  async findAllPriceMatchEditionMatch() {
    return this.webpagesRepository.find({
      where: {
        priceCheck: false,
        editionMatch: true,
        inspected: false,
        shopProduct: {
          shop: {
            active: true,
          },
        },
      },
      relations: {
        shopProduct: {
          shop: true,
        },
      },
      select: {
        id: true,
        url: true,
        price: true,
        reason: true,
        pageTitle: true,
        shopProduct: {
          id: true,
          name: true,
          shopId: true,
          links: true,
          shop: {
            id: true,
          },
        },
      },
    });
  }

  async findAllPriceMatchEditionMatchInStock() {
    return this.webpagesRepository.find({
      where: {
        inStock: true,
        priceCheck: false,
        editionMatch: true,
        inspected: false,
        notFoundCounter: 0,
        shopProduct: {
          shop: {
            active: true,
          },
        },
      },
      relations: {
        shopProduct: {
          shop: true,
          product: true,
        },
      },
      select: {
        id: true,
        url: true,
        price: true,
        euroPrice: true,
        reason: true,
        pageTitle: true,
        shopProduct: {
          id: true,
          name: true,
          shopId: true,
          links: true,
          product: {
            price: true,
            id: true,
          },
          shop: {
            id: true,
          },
        },
      },
    });
  }

  async findAllWebpagesShopProductPopulatedNotInspectedRemove() {
    const webpages = await this.webpagesRepository.find({
      where: {
        inspected: false,
      },
      relations: {
        shopProduct: true,
      },
    });
    for (const page of webpages) {
      await this.removeWebpage(page.id);
    }
  }

  // @Cron(CronExpression.EVERY_2_HOURS, {
  //   name: 'updateAllPages',
  // })
  // rate relief
  @Cron(`0 */6 * * *`)
  async updateAllPages(): Promise<void> {
    // Already doing high priority every 5 minutes
    const webPages = await this.findAllNonHighPriority();
    this.logger.log(webPages.length);
    for (const page of webPages) {
      this.logger.log(page);
      const updatePageDto: CheckPageDto = {
        url: page.url,
        query: page.shopProduct.name,
        type: page.shopProduct.product.type,
        shopWebsite: page.shopProduct.shop.name,
        webPageId: page.id,
        shopifySite: page.shopProduct.shop.sitemapEntity.isShopifySite,
        hash: page.webpageCache.hash,
        confirmed: page.webpageCache.confirmed,
        count: page.webpageCache.count,
        cloudflare: page.shopProduct.shop.cloudflare,
        variantId: page.variantId,
        headless: page.shopProduct.shop.headless,
        country: page.shopProduct.shop.country,
        currency: page.shopProduct.shop.country,
      };
      if (
        (page.shopProduct.shop.sitemapEntity.isShopifySite === true &&
          page.shopProduct.shop.cloudflare === false) ||
        (page.shopProduct.shop.cloudflare === false &&
          page.shopProduct.shop.headless === false)
      ) {
        this.headlessClient.emit('updatePage', updatePageDto);
      } else if (page.shopProduct.shop.headless === true) {
        this.headlessBrowserClient.emit('updatePage', updatePageDto);
      } else if (page.shopProduct.shop.cloudflare === true) {
        this.headfulClient.emit('updatePage', updatePageDto);
      } else {
        this.headfulClient.emit('updatePage', updatePageDto);
      }
    }

    const shopEnhanced =
      await this.shopService.findActiveCloudflareEnhancedShopsPopulatedShopProducts(
        false,
      );
    this.logger.log(shopEnhanced.length);

    for (const shop of shopEnhanced) {
      this.logger.log(shop);
      const webpagesForShop: CheckPageDto[] = [];

      for (const shopProduct of shop.shopProducts) {
        this.logger.log(shopProduct.id);
        const updatePageDto: CheckPageDto = {
          url: shopProduct.webPage.url,
          query: shopProduct.name,
          type: shopProduct.product.type,
          shopWebsite: shop.name,
          webPageId: shopProduct.webPage.id,
          shopifySite: shop.sitemapEntity.isShopifySite,
          hash: shopProduct.webPage.webpageCache.hash,
          confirmed: shopProduct.webPage.webpageCache.confirmed,
          count: shopProduct.webPage.webpageCache.count,
          cloudflare: shop.cloudflare,
          variantId: shopProduct.webPage.variantId,
          headless: shop.headless,
          country: shop.country,
          currency: shop.country,
        };
        webpagesForShop.push(updatePageDto);
      }

      const fullCheckPageDtoPayload: FullCheckPageDtoPayloadDto = {
        waitForPause: true,
        checkPageDto: webpagesForShop,
      };

      this.headfulSlowClient.emit<FullCheckPageDtoPayloadDto>(
        'updatePageBatch',
        fullCheckPageDtoPayload,
      );
    }
  }

  // @Cron(CronExpression.EVERY_5_MINUTES, {
  // rate relief
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'updateHighPriorityWebpages',
  })
  async updateHighPriorityWebpages(): Promise<void> {
    const webPages = await this.findAllHighPriority();
    this.logger.log(webPages.length);
    for (const page of webPages) {
      await new Promise((r) => setTimeout(r, 6));

      const updatePageDto: CheckPageDto = {
        url: page.url,
        query: page.shopProduct.name,
        type: page.shopProduct.product.type,
        shopWebsite: page.shopProduct.shop.name,
        webPageId: page.id,
        shopifySite: page.shopProduct.shop.sitemapEntity.isShopifySite,
        hash: page.webpageCache.hash,
        confirmed: page.webpageCache.confirmed,
        count: page.webpageCache.count,
        cloudflare: page.shopProduct.shop.cloudflare,
        variantId: page.variantId,
        headless: page.shopProduct.shop.headless,
        country: page.shopProduct.shop.country,
        currency: page.shopProduct.shop.country,
      };
      if (
        (page.shopProduct.shop.sitemapEntity.isShopifySite === true &&
          page.shopProduct.shop.cloudflare === false) ||
        (page.shopProduct.shop.cloudflare === false &&
          page.shopProduct.shop.headless === false)
      ) {
        this.headlessClient.emit('updatePage', updatePageDto);
      } else if (page.shopProduct.shop.headless === true) {
        this.headlessBrowserClient.emit('updatePage', updatePageDto);
      } else if (page.shopProduct.shop.cloudflare === true) {
        this.headfulClient.emit('updatePage', updatePageDto);
      } else {
        this.headfulClient.emit('updatePage', updatePageDto);
      }
    }

    const shopEnhanced =
      await this.shopService.findActiveCloudflareEnhancedShopsPopulatedShopProducts(
        true,
      );
    this.logger.log(shopEnhanced.length);

    // await new Promise((r) => setTimeout(r, 200000));

    for (const shop of shopEnhanced) {
      this.logger.log(shop);
      const webpagesForShop: CheckPageDto[] = [];

      for (const shopProduct of shop.shopProducts) {
        const updatePageDto: CheckPageDto = {
          url: shopProduct.webPage.url,
          query: shopProduct.name,
          type: shopProduct.product.type,
          shopWebsite: shop.name,
          webPageId: shopProduct.webPage.id,
          shopifySite: shop.sitemapEntity.isShopifySite,
          hash: shopProduct.webPage.webpageCache.hash,
          confirmed: shopProduct.webPage.webpageCache.confirmed,
          count: shopProduct.webPage.webpageCache.count,
          cloudflare: shop.cloudflare,
          variantId: shopProduct.webPage.variantId,
          headless: shop.headless,
          country: shop.country,
          currency: shop.country,
        };
        webpagesForShop.push(updatePageDto);
      }

      const fullPayload: FullCheckPageDtoPayloadDto = {
        waitForPause: false,
        checkPageDto: webpagesForShop,
      };

      this.headfulSlowClient.emit<FullCheckPageDtoPayloadDto>(
        'updatePageBatch',
        fullPayload,
      );
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
      shopifySite: page.shopProduct.shop.sitemapEntity.isShopifySite,
      hash: page.webpageCache.hash,
      confirmed: page.webpageCache.confirmed,
      count: page.webpageCache.count,
      cloudflare: page.shopProduct.shop.cloudflare,
      variantId: page.variantId,
      headless: page.shopProduct.shop.headless,
      country: page.shopProduct.shop.country,
      currency: page.shopProduct.shop.country,
    };
    this.logger.log(page);
    if (
      (page.shopProduct.shop.sitemapEntity.isShopifySite === true &&
        page.shopProduct.shop.cloudflare === false) ||
      (page.shopProduct.shop.cloudflare === false &&
        page.shopProduct.shop.headless === false)
    ) {
      this.headlessClient.emit('updatePage', updatePageDto);
      this.logger.log('emitting to headlessClient');
    } else {
      this.headfulClient.emit('updatePage', updatePageDto);
      this.logger.log(`emitting to headfulClient`);
    }
  }

  async findOne(id: string): Promise<Webpage> {
    return this.webpagesRepository.findOne({
      where: { id },
      relations: {
        shopProduct: {
          shop: {
            sitemapEntity: true,
          },
          product: true,
        },
        webpageCache: true,
      },
    });
  }

  async findOneByUrl(url: string): Promise<Webpage> {
    const entity = await this.webpagesRepository.findOne({
      where: { url },
      relations: {
        shopProduct: {
          shopProductBlacklistUrls: true,
        },
      },
    });
    return entity;
  }

  async updateInspected(id: string, state: boolean) {
    try {
      await this.webpagesRepository.update(id, { inspected: state });
      const webpageEntity = await this.findOne(id);
      await fetch(
        `${process.env.WEBSITE_URL}/api/revalidate?secret=${process.env.WEBSITE_SECRET}&productName=${webpageEntity.shopProduct.product.urlSafeName}`,
        { method: 'POST' },
      );
    } catch (error) {
      this.logger.error({ error, id });
    }
  }

  async updateNormal(id: string, updateWebpageDto: UpdateWebpageDto) {
    try {
      return this.webpagesRepository.update(id, updateWebpageDto);
    } catch (error) {
      this.logger.error({ error, updateWebpageDto, id });
    }
  }

  async update(
    id: string,
    updateWebpageDto: UpdateWebpageDto,
  ): Promise<Webpage> {
    await this.webpagesRepository.update(id, {
      price: updateWebpageDto.price ? updateWebpageDto.price : 0,
      inStock: updateWebpageDto.inStock,
      pageAllText: updateWebpageDto.pageAllText,
      pageTitle: updateWebpageDto.pageTitle,
      lastScanned: updateWebpageDto.lastScanned,
      euroPrice: updateWebpageDto.euroPrice,
      priceCheck: updateWebpageDto.priceCheck,
      notFoundCounter: 0,
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

  async removeProductWebpages(productId: string): Promise<boolean> {
    this.logger.log(productId);
    const webpages = await this.webpagesRepository.find({
      where: {
        shopProduct: { product: { id: productId } },
      },
      relations: {
        shopProduct: {
          product: true,
        },
      },
    });

    // Update associated shopProduct
    for (const webpage of webpages) {
      if (webpage.shopProduct) {
        await this.shopProductService.update(webpage.shopProduct.id, {
          populated: false,
        });
      }
      await this.remove(webpage.id);
    }
    return true;
  }

  async removeShopProductWebpages(shopProductId: string): Promise<boolean> {
    this.logger.log(shopProductId);
    const webpages = await this.webpagesRepository.find({
      where: {
        shopProduct: { id: shopProductId },
      },
      relations: ['shopProduct'],
    });

    // Update associated shopProduct
    for (const webpage of webpages) {
      if (webpage.shopProduct) {
        await this.shopProductService.update(webpage.shopProduct.id, {
          populated: false,
        });
      }
      await this.remove(webpage.id);
    }
    return true;
  }

  async removeWebpage(id: string): Promise<boolean> {
    this.logger.log(id);
    const webpage = await this.webpagesRepository.findOne({
      where: { id },
      relations: ['shopProduct'],
    });
    if (!webpage) throw new NotFoundException('Webpage not found');

    // Update associated shopProduct
    if (webpage.shopProduct) {
      webpage.shopProduct.populated = false;
      await this.shopProductService.update(webpage.shopProduct.id, {
        populated: false,
      });
    }
    this.eventEmitter.emit('webpage.remove', {
      url: webpage.url,
      shopProductId: webpage.shopProduct.id,
    });
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
      (webpage) => ((webpage.alertCount = 6), (webpage.disable = false)),
    );
    await this.webpagesRepository.save(webpageEntities);
  }

  async doesWebpageExistInSitemap() {
    const shopEntities =
      await this.shopService.findShopsWithActiveShopProducts();
    this.logger.log(shopEntities.length);
    const activeShopProducts: ShopProduct[] = [];
    for (const shop of shopEntities) {
      const sitemapUrls = new Set(
        shop.sitemapEntity.sitemapUrl.urls.map((urls) => urls.url),
      );
      const shopActiveShopProducts = shop.shopProducts.filter((shopProduct) => {
        const populated = shopProduct.populated;
        if (populated) {
          // this.logger.log({
          //   shopProduct,
          //   webpage: shopProduct.webPage,
          // })
          const result = sitemapUrls.has(shopProduct.webPage?.url)
            ? false
            : true;
          // this.logger.log(result);
          return result;
        } else {
          return false;
        }
      });
      activeShopProducts.push(...shopActiveShopProducts);
    }
    this.logger.log(activeShopProducts);
    return activeShopProducts.length > 0
      ? activeShopProducts.map((shopProduct) => shopProduct.webPage.url)
      : [];
  }

  async notFoundCounter(id: string) {
    const webpageEntity = await this.findOne(id);
    if (webpageEntity.notFoundCounter > 3) {
      // await this.updateNormal(id, { disable: true });
    } else {
      await this.updateNormal(id, {
        notFoundCounter: webpageEntity.notFoundCounter + 1,
      });
    }
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async updateEuroPrice() {
    const activeWebpages = await this.findAll();
    for (const webpage of activeWebpages) {
      const shopCurrency = webpage.shopProduct.shop.currency;
      if (shopCurrency === 'EUR') {
        await this.updateNormal(webpage.id, { euroPrice: webpage.price });
        continue;
      }

      this.logger.log(shopCurrency);

      const currencyInfo = await this.currencyService.findOneByBaseAndCompare(
        'EUR',
        shopCurrency,
      );
      const euroPrice = webpage.price / currencyInfo.value;
      await this.updateNormal(webpage.id, { euroPrice });
    }
  }

  // async updateEuroPriceForOne(id: string): Promise<void> {
  //   const webpage = await this.findOne(id);
  //   const shopCurrency = webpage.shopProduct.shop.currency;
  //   if (shopCurrency === 'EUR') {
  //     await this.updateNormal(webpage.id, { euroPrice: webpage.price });
  //     return;
  //   }

  //   this.logger.log(shopCurrency);

  //   const currencyInfo = await this.currencyService.findOneByBaseAndCompare(
  //     'EUR',
  //     shopCurrency,
  //   );
  //   const euroPrice = webpage.price / currencyInfo.value;
  //   await this.updateNormal(webpage.id, { euroPrice });
  // }

  async updatePriceCheck() {
    const webpages = await this.findAll();
    for (const page of webpages) {
      const priceCheck = this.utilService.isPriceInPriceCheck(
        page.euroPrice,
        page.shopProduct.product.price,
      );
      console.log(priceCheck);
      await this.updateNormal(page.id, { priceCheck });
    }
  }

  async pageUrlTest() {
    const webpages = await this.webpagesRepository.find({
      relations: {
        shopProduct: {
          product: true,
          shop: {
            sitemapEntity: {
              sitemapUrl: true,
            },
          },
        },
      },
      where: {
        inStock: true,
      },
    });

    const afterPages = [];
    const totalAmount = [];
    const failed = [];

    for (const page of webpages) {
      // const urls = await this.urlsRepository.find({
      //   where: {
      //     sitemapUrl: {
      //       id: page?.shopProduct?.shop?.sitemapEntity?.sitemapUrl?.id,
      //     },
      //   },
      //   select: {
      //     id: true,
      //     url: true,
      //   },
      // });

      const test = this.utilService.reduceSitemap(
        [page.url],
        page.shopProduct.product.name,
      );

      if (test.fuseWords.length > 0) {
        totalAmount.push({
          name: page.shopProduct.product.name,
          url: page.url,
        });
      } else {
        failed.push({ name: page.shopProduct.product.name, url: page.url });
      }
      if (test.fuseWords.length > 0 && test.fuseWords.includes(page.url)) {
        this.logger.debug({
          url: page.url,
          name: page.shopProduct.product.name,
        });
        afterPages.push(page.url);
      }
    }

    this.logger.debug({
      before: webpages.length,
      after: afterPages.length,
      totalAmount: totalAmount.length,
    });
    this.logger.debug(failed);
  }

  async addMissingVariantId() {
    const shopifyPages = await this.webpagesRepository.find({
      where: {
        variantId: IsNull(),
        shopProduct: {
          shop: {
            sitemapEntity: {
              isShopifySite: true,
            },
          },
        },
      },
      relations: {
        shopProduct: {
          shop: {
            sitemapEntity: true,
          },
        },
      },
    });
  }
}
