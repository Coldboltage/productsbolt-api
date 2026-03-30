import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpdateShopProductDto } from './dto/update-shop-product.dto';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ShopProduct } from './entities/shop-product.entity';
import {
  FindManyOptions,
  IsNull,
  Not,
  Repository,
  UpdateResult,
} from 'typeorm';
import { ShopService } from '../shop/shop.service';
import { Product } from '../product/entities/product.entity';
import { ClientProxy } from '@nestjs/microservices';
import { ProductService } from '../product/product.service';
import { CreateProcessDto } from '../shop/dto/create-process.dto';
import { Shop, UniqueShopType } from '../shop/entities/shop.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Url } from 'src/url/url.entity';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class ShopProductService {
  private logger = new Logger(ShopProductService.name);
  constructor(
    @Inject('HEADFUL_CLIENT') private headfulClient: ClientProxy,
    @Inject('HEADLESS_CLIENT') private headlessClient: ClientProxy,
    @Inject('HEADLESS_BROWSER_CLIENT')
    private headlessBrowserClient: ClientProxy,
    @Inject('HEADFUL_SLOW_CLIENT')
    private headfulSlowClient: ClientProxy,
    @InjectRepository(Url)
    private urlRepository: Repository<Url>,
    @InjectRepository(ShopProduct)
    private shopProductRepository: Repository<ShopProduct>,
    private shopService: ShopService,
    private productService: ProductService,
    private eventemitter: EventEmitter2,
    private utilService: UtilsService,
  ) {}
  async onApplicationBootstrap() {
    // Force the client to connect so we can inspect it
    await this.headfulClient.connect();
    await this.headlessClient.connect();
    await this.headlessBrowserClient.connect();

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
  }

  @OnEvent('product.created')
  async findShopsToUpdateProducts(product: Product): Promise<ShopProduct[]> {
    const shopsEntities = await this.shopService.findAllWithoutUrls();
    const shopProductsPromises = shopsEntities.map((shop) => {
      return this.shopProductRepository.save({
        name: product.name,
        shop,
        shopId: shop.id,
        product,
        productId: product.id,
      });
    });
    const shopProductResponses = await Promise.all(shopProductsPromises);
    for (const shopProductWithoutUrl of shopProductResponses) {
      const shopProduct = await this.findOneWithUrls(shopProductWithoutUrl.id);

      const reducedSitemap = this.shopService.reduceSitemap(
        shopProduct.shop.sitemapEntity.sitemapUrl.urls.map((urls) => urls.url),
        shopProduct.product.name,
      );

      if (reducedSitemap.fuseWords.length === 0) continue;

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        reducedSitemap.fuseWords,
      );

      this.logger.log(`Adding new product: ${shopProduct.product.name}`);

      const createProcess =
        this.createProcessDtoTemplateFromFindLinksShopProduct(
          shopProduct,
          shopProduct.shop,
          limitedUrls,
        );

      this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);

      // if (shopProduct.shop.isShopifySite === true) {
      //   this.headlessClient.emit<CreateProcessDto>(
      //     'webpageDiscovery',
      //     createProcess,
      //   );
      // } else {
      //   this.headfulClient.emit<CreateProcessDto>(
      //     'webpageDiscovery',
      //     createProcess,
      //   );
      // }
    }
    return shopProductResponses;
  }

  @OnEvent('shop.created')
  async newShopCreated(shop: Shop): Promise<ShopProduct[]> {
    this.logger.log(`Added Shop: ${shop.name}`);
    const productEntities = await this.productService.findAll();
    const shopProductsPromises = productEntities.map((product) => {
      return this.shopProductRepository.save({
        name: product.name,
        shop,
        shopId: shop.id,
        product,
        productId: product.id,
      });
    });
    const response = await Promise.all(shopProductsPromises);
    // Setup a sitemap emit to the worker for this shop
    this.logger.log(response);
    return response;
  }

  // Individual get links
  @OnEvent('create-links')
  async manualUpdateIndividualShopProductsImmediateLinks(
    shopProductId: string,
    bypass: boolean,
  ): Promise<void> {
    const whereClause: FindManyOptions<ShopProduct> = {
      where: {
        id: shopProductId,
        shop: {
          active: true,
        },
      },
      relations: {
        product: true,
        shop: {
          sitemapEntity: {
            sitemapUrl: true,
          },
        },
        webPage: true,
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        candidatePages: {
          candidatePageCache: true,
        },
      },
    };

    if (!bypass) {
      whereClause.where['populated'] = false;
    }

    const shopProduct = await this.shopProductRepository.findOne(whereClause);

    const urls = await this.urlRepository.find({
      where: {
        sitemapUrl: { id: shopProduct.shop.sitemapEntity.sitemapUrl.id },
      },
      select: {
        url: true,
      },
    });

    // this.logger.log(shopProduct);

    if (!shopProduct)
      throw new NotFoundException('shop_product_not_found_or_populated');

    const reducedSitemap = this.shopService.reduceSitemap(
      // eslint-disable-next-line prettier/prettier
      urls.map((urls) => urls.url),
      shopProduct.product.name,
    );

    this.logger.log(shopProduct.product.name);

    this.logger.log(urls.length);
    this.logger.log(reducedSitemap);

    if (reducedSitemap.fuseWords.length === 0)
      throw new Error('no_urls_found_for_product');

    const limitedUrls = await this.filteredLimitedUrls(
      shopProduct,
      reducedSitemap.fuseWords,
    );

    if (limitedUrls.length === 0) {
      this.logger.log(
        `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name} but was found in reduced sitemap: ${reducedSitemap}`,
      );
      throw new NotFoundException(`No URLs found for ${shopProduct.shop.name}`);
    }

    limitedUrls.push(...shopProduct.links);

    // const test = limitedUrls.some((url) =>
    //   url.includes(
    //     `trading-card-game-spiritforged-sealed-booster-box-set-2-p88590`,
    //   ),
    // );

    // this.logger.debug(test);
    // throw new Error('test');

    const createProcess = this.createProcessDtoTemplateFromFindLinksShopProduct(
      shopProduct,
      shopProduct.shop,
      limitedUrls,
    );

    if (
      shopProduct.shop.uniqueShopType === UniqueShopType.EBAY &&
      shopProduct.ebayProductDetail
    ) {
      createProcess.ebayProductDetail = {
        ebayProductDetailId: shopProduct.ebayProductDetail.id,
        productId: shopProduct.ebayProductDetail.productId,
      };
    }

    this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);

    // if (shopProduct.shop.isShopifySite === true) {
    //   this.logger.log('shopifySiteFound');
    //   this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);
    // } else {
    //   this.logger.log('normal setup');
    //   this.headfulClient.emit<CreateProcessDto>('findLinks', createProcess);
    // }
    await new Promise((r) => setTimeout(r, 100));
  }

  // Get all the links for product
  async manuallyUpdateLinksForSpecificProduct(
    productId: string,
  ): Promise<void> {
    const whereClause: FindManyOptions<ShopProduct> = {
      where: {
        shop: {
          active: true,
        },
        product: {
          id: productId,
        },
      },
      relations: {
        product: true,
        shop: {
          sitemapEntity: {
            sitemapUrl: true,
          },
        },
        webPage: true,
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        candidatePages: {
          candidatePageCache: true,
        },
      },
    };

    const shopProductsOrphan = await (
      await this.shopProductRepository.find(whereClause)
    ).sort(() => Math.random() - 0.5);
    this.logger.log(shopProductsOrphan.length);

    for (const shopProduct of shopProductsOrphan) {
      if (!shopProduct) continue;

      shopProduct.shop.sitemapEntity.sitemapUrl;

      const reducedSitemap = this.shopService.reduceSitemap(
        shopProduct.shop.sitemapEntity.sitemapUrl.urls.map((urls) => urls.url),
        shopProduct.product.name,
      );

      if (reducedSitemap.fuseWords.length === 0) continue;

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        reducedSitemap.fuseWords,
      );

      if (limitedUrls.length === 0) {
        this.logger.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      limitedUrls.push(...shopProduct.links);

      const createProcess =
        this.createProcessDtoTemplateFromFindLinksShopProduct(
          shopProduct,
          shopProduct.shop,
          limitedUrls,
        );

      this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);

      // if (shopProduct.shop.isShopifySite === true) {
      //   this.logger.log('shopifySiteFound');
      //   this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);
      // } else {
      //   this.logger.log('normal setup');
      //   this.headfulClient.emit<CreateProcessDto>('findLinks', createProcess);
      // }
      await new Promise((r) => setTimeout(r, 1));
    }
  }

  // Get all the links
  async manualUpdateAllShopProductsImmediateLinks(
    scanAll: boolean,
  ): Promise<void> {
    const whereClause: FindManyOptions<ShopProduct> = {
      where: {
        shop: {
          active: true,
        },
      },
      relations: {
        product: true,
        shop: {
          sitemapEntity: {
            sitemapUrl: true,
          },
        },
        webPage: true,
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        candidatePages: {
          candidatePageCache: true,
        },
      },
    };

    if (!scanAll) {
      whereClause.where['populated'] = false;
    }

    const shopProductsOrphans = await (
      await this.shopProductRepository.find(whereClause)
    ).sort(() => Math.random() - 0.5);
    this.logger.log(shopProductsOrphans.length);

    const totalUrls = [];

    for (const [index, shopProductsOrphan] of shopProductsOrphans.entries()) {
      if (!shopProductsOrphan) continue;

      // const shopProduct = await this.findOneWithUrls(shopProductsOrphan.id);

      const urls = await this.urlRepository.find({
        where: {
          sitemapUrl: {
            id: shopProductsOrphan.shop.sitemapEntity.sitemapUrl.id,
          },
        },
        relations: {
          sitemapUrl: true,
        },
        select: {
          url: true,
        },
      });

      const reducedSitemap = this.utilService.reduceSitemap(
        urls.map((urls) => urls.url),
        shopProductsOrphan.product.name,
      );

      totalUrls.push(...reducedSitemap.fuseWords);

      if (reducedSitemap.fuseWords.length === 0) continue;

      const limitedUrls = await this.filteredLimitedUrls(
        shopProductsOrphan,
        reducedSitemap.fuseWords,
      );

      if (limitedUrls.length === 0) {
        this.logger.log(
          `No URLs found for ${shopProductsOrphan.shop.name} - ${shopProductsOrphan.product.name}`,
        );
        continue;
      }

      limitedUrls.push(...shopProductsOrphan.links);

      const createProcess =
        this.createProcessDtoTemplateFromFindLinksShopProduct(
          shopProductsOrphan,
          shopProductsOrphan.shop,
          limitedUrls,
        );

      if (
        shopProductsOrphan.shop.uniqueShopType === UniqueShopType.EBAY &&
        shopProductsOrphan.ebayProductDetail
      ) {
        createProcess.ebayProductDetail = {
          ebayProductDetailId: shopProductsOrphan.ebayProductDetail.id,
          productId: shopProductsOrphan.ebayProductDetail.productId,
        };
      }

      this.logger.debug({
        current: `${index} of ${shopProductsOrphans.length}`,
        message: `completed full loop`,
        totalUrls: totalUrls.length,
      });

      this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);

      // if (shopProduct.shop.isShopifySite === true) {
      //   this.logger.log('shopifySiteFound');
      //   this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);
      // } else {
      //   this.logger.log('normal setup');
      //   this.headfulClient.emit<CreateProcessDto>('findLinks', createProcess);
      // }
      await new Promise((r) => setTimeout(r, 1));
    }

    this.logger.debug({
      message: `completed full loop`,
      totalUrls: totalUrls.length,
    });
  }

  // Get all the links
  async manualUpdateAllShopProductsImmediateLinksPriority(
    scanAll: boolean,
  ): Promise<void> {
    const whereClause: FindManyOptions<ShopProduct> = {
      where: {
        shop: {
          active: true,
        },
        product: {
          priority: true,
        },
      },
      relations: {
        product: true,
        shop: {
          sitemapEntity: {
            sitemapUrl: true,
          },
        },
        webPage: true,
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        candidatePages: {
          candidatePageCache: true,
        },
      },
    };

    if (!scanAll) {
      whereClause.where['populated'] = false;
    }

    const shopProductsOrphans = await (
      await this.shopProductRepository.find(whereClause)
    ).sort(() => Math.random() - 0.5);
    this.logger.log(shopProductsOrphans.length);

    const totalUrls = [];

    for (const [index, shopProductsOrphan] of shopProductsOrphans.entries()) {
      if (!shopProductsOrphan) continue;

      // const shopProduct = await this.findOneWithUrls(shopProductsOrphan.id);

      const urls = await this.urlRepository.find({
        where: {
          sitemapUrl: {
            id: shopProductsOrphan.shop.sitemapEntity.sitemapUrl.id,
          },
        },
        relations: {
          sitemapUrl: true,
        },
        select: {
          url: true,
        },
      });

      const reducedSitemap = this.utilService.reduceSitemap(
        urls.map((urls) => urls.url),
        shopProductsOrphan.product.name,
      );

      totalUrls.push(...reducedSitemap.fuseWords);

      if (reducedSitemap.fuseWords.length === 0) continue;

      const limitedUrls = await this.filteredLimitedUrls(
        shopProductsOrphan,
        reducedSitemap.fuseWords,
      );

      if (limitedUrls.length === 0) {
        this.logger.log(
          `No URLs found for ${shopProductsOrphan.shop.name} - ${shopProductsOrphan.product.name}`,
        );
        continue;
      }

      limitedUrls.push(...shopProductsOrphan.links);

      const createProcess =
        this.createProcessDtoTemplateFromFindLinksShopProduct(
          shopProductsOrphan,
          shopProductsOrphan.shop,
          limitedUrls,
        );

      if (
        shopProductsOrphan.shop.uniqueShopType === UniqueShopType.EBAY &&
        shopProductsOrphan.ebayProductDetail
      ) {
        createProcess.ebayProductDetail = {
          ebayProductDetailId: shopProductsOrphan.ebayProductDetail.id,
          productId: shopProductsOrphan.ebayProductDetail.productId,
        };
      }

      this.logger.debug({
        current: `${index} of ${shopProductsOrphans.length}`,
        message: `completed full loop`,
        totalUrls: totalUrls.length,
      });

      this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);

      // if (shopProduct.shop.isShopifySite === true) {
      //   this.logger.log('shopifySiteFound');
      //   this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);
      // } else {
      //   this.logger.log('normal setup');
      //   this.headfulClient.emit<CreateProcessDto>('findLinks', createProcess);
      // }
      await new Promise((r) => setTimeout(r, 1));
    }

    this.logger.debug({
      message: `completed full loop`,
      totalUrls: totalUrls.length,
    });
  }

  async manualUpdateAllShopProductsForShopImmediateLinksPriority(
    shopId: string,
    scanAll: boolean,
  ): Promise<void> {
    const whereClause: FindManyOptions<ShopProduct> = {
      where: {
        shop: {
          id: shopId,
          active: true,
        },
        product: {
          priority: true,
        },
      },
      relations: {
        product: true,
        shop: {
          sitemapEntity: {
            sitemapUrl: true,
          },
        },
        webPage: true,
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        candidatePages: {
          candidatePageCache: true,
        },
      },
    };

    if (!scanAll) {
      whereClause.where['populated'] = false;
    }

    // const shopProductsOrphan = await (
    //   await this.shopProductRepository.find(whereClause)
    // ).sort(() => Math.random() - 0.5);
    // this.logger.log(shopProductsOrphan.length);

    const shopProductsOrphan =
      await this.shopProductRepository.find(whereClause);
    shopProductsOrphan.sort(() => Math.random() - 0.5);

    // await new Promise((r) => setTimeout(r, 200000000));

    for (const shopProduct of shopProductsOrphan) {
      if (!shopProduct) continue;

      const freshUrls = await this.urlRepository.find({
        where: {
          sitemapUrl: {
            id: shopProduct.shop.sitemapEntity.sitemapUrl.id,
          },
          freshUrl: true,
        },
      });

      const freshUrlsList = freshUrls.map((freshUrls) => freshUrls.url);

      const reducedSitemap = this.shopService.reduceSitemap(
        freshUrlsList,
        shopProduct.product.name,
      );

      if (reducedSitemap.fuseWords.length === 0) {
        this.logger.error({
          shopProductId: shopProduct.id,
          error: `reducedSitemap.length === 0`,
          freshUrls: freshUrlsList,
        });
      }

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        reducedSitemap.fuseWords,
      );

      if (limitedUrls.length === 0) {
        this.logger.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name} but was found in reduced sitemap: ${reducedSitemap}`,
        );
        continue;
      }

      limitedUrls.push(...shopProduct.links);

      const createProcess =
        this.createProcessDtoTemplateFromFindLinksShopProduct(
          shopProduct,
          shopProduct.shop,
          limitedUrls,
        );

      if (
        shopProduct.shop.uniqueShopType === UniqueShopType.EBAY &&
        shopProduct.ebayProductDetail
      ) {
        createProcess.ebayProductDetail = {
          ebayProductDetailId: shopProduct.ebayProductDetail.id,
          productId: shopProduct.ebayProductDetail.productId,
        };
      }
      this.logger.debug(`shopProduct updating: ${shopProduct.id}`);
      this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);

      // if (shopProduct.shop.isShopifySite === true) {
      //   this.logger.log('shopifySiteFound');
      //   this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);
      // } else {
      //   this.logger.log('normal setup');
      //   this.headfulClient.emit<CreateProcessDto>('findLinks', createProcess);
      // }
      await new Promise((r) => setTimeout(r, 1));
    }

    this.logger.verbose('everything completed');
  }

  async manualUpdateAllShopProductsForShopImmediateLinks(
    shopId: string,
    scanAll: boolean,
  ): Promise<void> {
    const whereClause: FindManyOptions<ShopProduct> = {
      where: {
        shop: {
          id: shopId,
          active: true,
        },
      },
      relations: {
        product: true,
        shop: {
          sitemapEntity: {
            sitemapUrl: true,
          },
        },
        webPage: true,
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        candidatePages: {
          candidatePageCache: true,
        },
      },
    };

    if (!scanAll) {
      whereClause.where['populated'] = false;
    }

    // const shopProductsOrphan = await (
    //   await this.shopProductRepository.find(whereClause)
    // ).sort(() => Math.random() - 0.5);
    // this.logger.log(shopProductsOrphan.length);

    const shopProductsOrphan =
      await this.shopProductRepository.find(whereClause);
    shopProductsOrphan.sort(() => Math.random() - 0.5);

    // await new Promise((r) => setTimeout(r, 200000000));

    for (const shopProduct of shopProductsOrphan) {
      if (!shopProduct) continue;

      const freshUrls = await this.urlRepository.find({
        where: {
          sitemapUrl: {
            id: shopProduct.shop.sitemapEntity.sitemapUrl.id,
          },
          freshUrl: true,
        },
      });

      const freshUrlsList = freshUrls.map((freshUrls) => freshUrls.url);

      this.logger.debug({
        freshUrlsList: freshUrlsList.length,
        sitemapUrlId: shopProduct.shop.sitemapEntity.sitemapUrl.id,
      });

      // const urls = await this.urlRepository.find({
      //   where: {
      //     sitemapUrl: {
      //       id: shopProduct.shop.sitemapEntity.sitemapUrl.id,
      //     },
      //   },
      // });

      // const reducedSitemap = this.shopService.reduceSitemap(
      //   urls.map((urls) => urls.url),
      //   shopProduct.product.name,
      // );

      const reducedSitemap = this.shopService.reduceSitemap(
        freshUrlsList,
        shopProduct.product.name,
      );

      if (reducedSitemap.fuseWords.length === 0) {
        this.logger.error({
          shopProductId: shopProduct.id,
          error: `reducedSitemap.length === 0`,
          freshUrls: freshUrlsList.length,
        });
      }

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        reducedSitemap.fuseWords,
      );

      if (limitedUrls.length === 0) {
        this.logger.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name} but was found in reduced sitemap: ${reducedSitemap}`,
        );
        continue;
      }

      limitedUrls.push(...shopProduct.links);

      const createProcess =
        this.createProcessDtoTemplateFromFindLinksShopProduct(
          shopProduct,
          shopProduct.shop,
          limitedUrls,
        );

      if (
        shopProduct.shop.uniqueShopType === UniqueShopType.EBAY &&
        shopProduct.ebayProductDetail
      ) {
        createProcess.ebayProductDetail = {
          ebayProductDetailId: shopProduct.ebayProductDetail.id,
          productId: shopProduct.ebayProductDetail.productId,
        };
      }
      this.logger.debug(`shopProduct updating: ${shopProduct.id}`);
      // this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);

      // if (shopProduct.shop.isShopifySite === true) {
      //   this.logger.log('shopifySiteFound');
      //   this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);
      // } else {
      //   this.logger.log('normal setup');
      //   this.headfulClient.emit<CreateProcessDto>('findLinks', createProcess);
      // }
      await new Promise((r) => setTimeout(r, 1));
    }

    this.logger.verbose('everything completed');
  }

  // @Cron('0 1,3,5,7,9,11,13,15,17,19,21,23 * * *', { timeZone: 'Europe/London' })
  // Rate relief
  // @Cron(`0 */6 * * *`)
  async manualUpdateAllShopProducts(): Promise<string> {
    this.manualUpdateAllShopProductsEvent();
    return 'manualUpdateAllShopProductsEvent fired';
  }

  // Rate relief delete cron below
  @Cron(`0 */24 * * *`)
  async manualUpdateAllShopProductsImmediate(): Promise<void> {
    const shopProductsOrphan = await (
      await this.shopProductRepository.find({
        where: {
          populated: false,
          shop: {
            active: true,
            cloudflareEnhanced: false,
          },
        },
        relations: {
          product: true,
          shop: {
            sitemapEntity: true,
          },
          webPage: true,
          shopProductBlacklistUrls: {
            blackListUrl: true,
          },
          candidatePages: {
            candidatePageCache: true,
          },
        },
      })
    ).sort(() => Math.random() - 0.5);
    this.logger.log(shopProductsOrphan.length);

    for (const shopProduct of shopProductsOrphan) {
      // const reducedSitemap = this.shopService.reduceSitemap(
      //   shopProduct.shop.sitemapEntity.sitemapUrl.urls,
      //   shopProduct.product.name,
      // );

      // if (reducedSitemap.length === 0) continue;

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        shopProduct.links,
      );

      if (limitedUrls.length === 0) {
        this.logger.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      const createProcess =
        this.createProcessDtoTemplateFromWebpageDiscoveryShopProduct(
          shopProduct,
          shopProduct.shop,
          limitedUrls,
        );

      if (
        shopProduct.shop.uniqueShopType === UniqueShopType.EBAY &&
        shopProduct.ebayProductDetail
      ) {
        createProcess.ebayProductDetail = {
          ebayProductDetailId: shopProduct.ebayProductDetail.id,
          productId: shopProduct.ebayProductDetail.productId,
        };
      }

      if (
        (shopProduct.shop.isShopifySite === true &&
          shopProduct.shop.cloudflare === false) ||
        (shopProduct.shop.cloudflare === false &&
          shopProduct.shop.headless === false)
      ) {
        this.logger.log('shopifySiteFound');
        this.headlessClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else if (shopProduct.shop.headless === true) {
        this.headlessBrowserClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else if (shopProduct.shop.cloudflareEnhanced === true) {
        this.headfulSlowClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else {
        this.logger.log('normal setup');
        this.headfulClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      }
    }

    const shopsWithProductsOrphanCloudflareEnhanced =
      await this.shopService.findActiveCloudflareEnhancedShopsNonPopulatedShopProducts();

    for (const shop of shopsWithProductsOrphanCloudflareEnhanced) {
      const shopOfCreateProcess: CreateProcessDto[] = [];
      for (const shopProduct of shop.shopProducts) {
        const limitedUrls = await this.filteredLimitedUrls(
          shopProduct,
          shopProduct.links,
        );

        if (limitedUrls.length === 0) {
          this.logger.log(
            `No URLs found for ${shop.name} - ${shopProduct.product.name}`,
          );
          continue;
        }

        const createProcess =
          this.createProcessDtoTemplateFromWebpageDiscoveryShopProduct(
            shopProduct,
            shop,
            limitedUrls,
          );

        shopOfCreateProcess.push(createProcess);
      }

      if (shopOfCreateProcess.length > 0) {
        this.logger.log(`webpageDiscoveryHeadful fired for: ${shop.id}`);
        this.headfulSlowClient.emit<CreateProcessDto[]>(
          'webpageDiscoveryHeadful',
          shopOfCreateProcess,
        );
      } else {
        this.logger.log(
          `no shopProducts found for webpageDiscoveryHeadful: ${shop.id}`,
        );
      }
    }
  }

  async manualUpdateAllShopProductsEvent(): Promise<void> {
    const shopProductsOrphan = await (
      await this.shopProductRepository.find({
        where: {
          populated: false,
          shop: {
            active: true,
          },
        },
        relations: {
          product: true,
          shop: {
            sitemapEntity: true,
          },
          webPage: true,
          shopProductBlacklistUrls: {
            blackListUrl: true,
          },
          candidatePages: {
            candidatePageCache: true,
          },
        },
      })
    ).sort(() => Math.random() - 0.5);
    this.logger.log(shopProductsOrphan.length);

    const increment = Math.ceil(shopProductsOrphan.length / 20);

    let index = 0;

    while (index < shopProductsOrphan.length) {
      const shopProductsOrphanSlice = shopProductsOrphan.slice(
        index,
        index + increment,
      );

      for (const shopProduct of shopProductsOrphanSlice) {
        // const reducedSitemap = this.shopService.reduceSitemap(
        //   shopProduct.shop.sitemapEntity.sitemapUrl.urls,
        //   shopProduct.product.name,
        // );

        // if (reducedSitemap.length === 0) continue;

        await new Promise((r) => setTimeout(r, 6));

        const limitedUrls = await this.filteredLimitedUrls(
          shopProduct,
          shopProduct.links,
        );

        if (limitedUrls.length === 0) {
          this.logger.log(
            `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
          );
          continue;
        }

        // if (shopProduct.links.length === 0) {
        //   this.logger.log(
        //     `no_links_found ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        //   );
        //   continue;
        // }

        const createProcess =
          this.createProcessDtoTemplateFromWebpageDiscoveryShopProduct(
            shopProduct,
            shopProduct.shop,
            limitedUrls,
          );

        if (
          shopProduct.shop.uniqueShopType === UniqueShopType.EBAY &&
          shopProduct.ebayProductDetail
        ) {
          createProcess.ebayProductDetail = {
            ebayProductDetailId: shopProduct.ebayProductDetail.id,
            productId: shopProduct.ebayProductDetail.productId,
          };
        }

        if (
          (shopProduct.shop.isShopifySite === true &&
            shopProduct.shop.cloudflare === false) ||
          (shopProduct.shop.cloudflare === false &&
            shopProduct.shop.headless === false)
        ) {
          this.logger.log('shopifySiteFound');
          this.headlessClient.emit<CreateProcessDto>(
            'webpageDiscovery',
            createProcess,
          );
        } else if (shopProduct.shop.cloudflareEnhanced === true) {
          this.headfulSlowClient.emit<CreateProcessDto>(
            'webpageDiscovery',
            createProcess,
          );
        } else if (shopProduct.shop.headless === true) {
          this.headlessBrowserClient.emit<CreateProcessDto>(
            'webpageDiscovery',
            createProcess,
          );
        } else {
          this.logger.log('normal setup');
          this.headfulClient.emit<CreateProcessDto>(
            'webpageDiscovery',
            createProcess,
          );
        }
        await new Promise((r) => setTimeout(r, 100));
      }

      index += increment;

      if (index < shopProductsOrphan.length) {
        this.logger.log(
          `Stopped at Index: ${index} Waiting 5 minutes before next batch...`,
        );
        await new Promise((r) => setTimeout(r, 5 * 60 * 1000));
      }
    }
  }
  async filteredLimitedUrls(
    shopProduct: ShopProduct,
    reducedSitemap: string[],
  ) {
    let blackListUrls: string[] = [];

    if (shopProduct.shopProductBlacklistUrls) {
      blackListUrls = shopProduct.shopProductBlacklistUrls.map(
        (shopProductBlacklistUrl) => shopProductBlacklistUrl.blackListUrl.url,
      );
    }

    // this.logger.log(blackListUrls);

    // await new Promise((r) => setTimeout(r, 20000000));

    const shopEntity = await this.shopService.findOne(shopProduct.shopId);

    const shopProductUrlList = shopEntity.shopProducts
      .filter((shopProduct) => {
        if (shopProduct.webPage) return shopProduct.webPage.url;
      })
      .map((shopProduct) => shopProduct.webPage.url);

    const restrictedUrls = [...blackListUrls, ...shopProductUrlList];

    const checks = await Promise.all(
      reducedSitemap.map(async (url) => {
        const isRestricted = restrictedUrls.includes(url);
        const alreadyExists = await this.shopProductRepository.exists({
          where: { webPage: { url } },
        });
        return { url, keep: !isRestricted && !alreadyExists };
      }),
    );

    const limitedUrls = checks.filter((url) => url.keep).map((url) => url.url);

    // const momentOfTruth = limitedUrls.includes(
    //   'https://bossminis.co.uk/products/magic-the-gathering-edge-of-eternities-collector-booster-pack-releases-01-08-20205',
    // );

    // this.logger.log(momentOfTruth);

    // await new Promise((r) => setTimeout(r, 20000000));
    return limitedUrls;
  }

  async manualFindShopsToUpdateProducts(productId: string): Promise<void> {
    const product = await this.productService.findOne(productId);
    this.logger.log(`Adding new product: ${product.name}`);

    const shopProductsOrphan = await this.shopProductRepository.find({
      where: {
        populated: false,
        shop: {
          active: true,
          cloudflareEnhanced: false,
        },
        productId: productId,
      },
      relations: {
        shop: {
          sitemapEntity: true,
        },
        webPage: true,
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        product: true,
        candidatePages: {
          candidatePageCache: true,
        },
      },
    });

    this.logger.log(shopProductsOrphan.length);

    for (const shopProduct of shopProductsOrphan) {
      // const reducedSitemap = this.shopService.reduceSitemap(
      //   shopProduct.shop.sitemapEntity.sitemapUrl.urls,
      //   shopProduct.product.name,
      // );

      await new Promise((r) => setTimeout(r, 6));

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        shopProduct.links,
      );

      if (limitedUrls.length === 0) {
        this.logger.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      // if (shopProduct.links.length === 0) {
      //   this.logger.log(
      //     `no_links_found ${shopProduct.shop.name} - ${shopProduct.product.name}`,
      //   );
      //   continue;
      // }

      const createProcess =
        this.createProcessDtoTemplateFromWebpageDiscoveryShopProduct(
          shopProduct,
          shopProduct.shop,
          limitedUrls,
        );

      if (
        shopProduct.shop.uniqueShopType === UniqueShopType.EBAY &&
        shopProduct.ebayProductDetail
      ) {
        createProcess.ebayProductDetail = {
          ebayProductDetailId: shopProduct.ebayProductDetail.id,
          productId: shopProduct.ebayProductDetail.productId,
        };
      }

      if (
        (shopProduct.shop.isShopifySite === true &&
          shopProduct.shop.cloudflare === false) ||
        (shopProduct.shop.cloudflare === false &&
          shopProduct.shop.headless === false)
      ) {
        this.headlessClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else if (shopProduct.shop.cloudflareEnhanced === true) {
        this.headfulSlowClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else if (shopProduct.shop.headless === true) {
        this.headlessBrowserClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else {
        this.headfulClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      }
    }

    const shopsWithProductsOrphanCloudflareEnhanced =
      await this.shopService.findActiveCloudflareEnhancedShopsNonPopulatedShopProductsByProductId(
        productId,
      );

    for (const shop of shopsWithProductsOrphanCloudflareEnhanced) {
      const shopOfCreateProcess: CreateProcessDto[] = [];
      for (const shopProduct of shop.shopProducts) {
        const limitedUrls = await this.filteredLimitedUrls(
          shopProduct,
          shopProduct.links,
        );

        if (limitedUrls.length === 0) {
          this.logger.log(
            `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
          );
          continue;
        }

        const createProcess =
          this.createProcessDtoTemplateFromWebpageDiscoveryShopProduct(
            shopProduct,
            shop,
            limitedUrls,
          );

        shopOfCreateProcess.push(createProcess);
      }

      if (shopOfCreateProcess.length > 0) {
        this.logger.log(`webpageDiscoveryHeadful fired for: ${shop.id}`);
        this.headfulSlowClient.emit<CreateProcessDto>(
          'webpageDiscoveryHeadful',
          shopOfCreateProcess,
        );
      } else {
        this.logger.log(
          `no shopProducts found for webpageDiscoveryHeadful: ${shop.id}`,
        );
      }
    }
  }

  async manuallyUpdateShopProductsByShopId(shopId: string): Promise<void> {
    const shop = await this.shopService.findOne(shopId);
    this.logger.log(`Adding new product: ${shop.name}`);

    const shopProductsOrphan = await this.shopProductRepository.find({
      where: {
        populated: false,
        shop: {
          active: true,
          id: shopId,
          cloudflareEnhanced: false,
        },
      },
      relations: {
        shop: {
          sitemapEntity: true,
        },
        webPage: true,
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        product: true,
        candidatePages: {
          candidatePageCache: true,
        },
      },
    });

    for (const shopProduct of shopProductsOrphan) {
      // const reducedSitemap = this.shopService.reduceSitemap(
      //   shopProduct.shop.sitemapEntity.sitemapUrl.urls,
      //   shopProduct.product.name,
      // );

      // await new Promise((r) => setTimeout(r, 6));

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        shopProduct.links,
      );

      if (limitedUrls.length === 0) {
        this.logger.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      // if (shopProduct.links.length === 0) {
      //   this.logger.log(
      //     `no_links_found ${shopProduct.shop.name} - ${shopProduct.product.name}`,
      //   );
      //   continue;
      // }

      const createProcess =
        this.createProcessDtoTemplateFromWebpageDiscoveryShopProduct(
          shopProduct,
          shopProduct.shop,
          limitedUrls,
        );

      if (
        shopProduct.shop.uniqueShopType === UniqueShopType.EBAY &&
        shopProduct.ebayProductDetail
      ) {
        createProcess.ebayProductDetail = {
          ebayProductDetailId: shopProduct.ebayProductDetail.id,
          productId: shopProduct.ebayProductDetail.productId,
        };
      }

      if (
        (shopProduct.shop.isShopifySite === true &&
          shopProduct.shop.cloudflare === false) ||
        (shopProduct.shop.cloudflare === false &&
          shopProduct.shop.headless === false)
      ) {
        this.headlessClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else if (shopProduct.shop.cloudflareEnhanced === true) {
        this.headfulSlowClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else if (shopProduct.shop.headless === true) {
        this.headlessBrowserClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else {
        this.headfulClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      }
    }

    const shopsWithProductsOrphanCloudflareEnhanced =
      await this.shopService.findActiveCloudflareEnhancedShopsNonPopulatedShopProductsByShopId(
        shopId,
      );

    const shopOfCreateProcess: CreateProcessDto[] = [];
    for (const shopProduct of shopsWithProductsOrphanCloudflareEnhanced.shopProducts) {
      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        shopProduct.links,
      );

      if (limitedUrls.length === 0) {
        this.logger.log(
          `No URLs found for ${shopsWithProductsOrphanCloudflareEnhanced.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      const createProcess =
        this.createProcessDtoTemplateFromWebpageDiscoveryShopProduct(
          shopProduct,
          shopsWithProductsOrphanCloudflareEnhanced,
          limitedUrls,
        );

      shopOfCreateProcess.push(createProcess);
    }

    if (shopOfCreateProcess.length > 0) {
      this.logger.log(`webpageDiscoveryHeadful fired for: ${shop.id}`);
      this.headfulSlowClient.emit<CreateProcessDto>(
        'webpageDiscoveryHeadful',
        shopOfCreateProcess,
      );
    } else {
      this.logger.log(
        `no shopProducts found for webpageDiscoveryHeadful: ${shop.id}`,
      );
    }
  }

  async manuallyUpdateShopProductsByShopIdBatch(shopId: string): Promise<void> {
    const shop = await this.shopService.findOne(shopId);
    this.logger.log(`Adding new product: ${shop.name}`);

    const shopProductsOrphan = await this.shopProductRepository.find({
      where: {
        populated: false,
        shop: {
          active: true,
          id: shopId,
          cloudflare: true,
          cloudflareEnhanced: true,
        },
      },
      relations: {
        shop: {
          sitemapEntity: true,
        },
        webPage: true,
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        product: true,
        candidatePages: {
          candidatePageCache: true,
        },
      },
    });

    this.logger.debug(shopProductsOrphan.length);

    const shopOfShopProducts: CreateProcessDto[] = [];

    for (const shopProduct of shopProductsOrphan) {
      // const reducedSitemap = this.shopService.reduceSitemap(
      //   shopProduct.shop.sitemapEntity.sitemapUrl.urls,
      //   shopProduct.product.name,
      // );

      // await new Promise((r) => setTimeout(r, 6));

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        shopProduct.links,
      );

      // this.logger.debug(limitedUrls.length);

      if (limitedUrls.length === 0) {
        this.logger.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      // if (shopProduct.links.length === 0) {
      //   this.logger.log(
      //     `no_links_found ${shopProduct.shop.name} - ${shopProduct.product.name}`,
      //   );
      //   continue;
      // }

      const createProcess =
        this.createProcessDtoTemplateFromWebpageDiscoveryShopProduct(
          shopProduct,
          shopProduct.shop,
          limitedUrls,
        );

      shopOfShopProducts.push(createProcess);
    }

    this.headfulSlowClient.emit<CreateProcessDto[]>(
      'webpageDiscoveryHeadful',
      shopOfShopProducts,
    );
  }

  // async manualCheckAllShopsShopfiy() {
  //   const shopProdutEntities = await this.findOneWebPageFromShop()
  //   this.logger.log(shopProdutEntities.length);

  //   for (const shopProduct of shopProdutEntities) {
  //     const createProcess: CreateProcessDto = {
  //       sitemap: shop.sitemap,
  //       url: shopProduct.shop.website,
  //       category: shopProduct.shop.category,
  //       name: shopProduct.product.name,
  //       shopWebsite: shopProduct.shop.name,
  //       type: shopProduct.product.type,
  //       context: shopProduct.product.context,
  //       crawlAmount: 90,
  //       sitemapUrls: shopProduct.shop.sitemapUrls,
  //       productId: shopProduct.productId,
  //       shopId: shopProduct.shopId,
  //     };
  //     this.headfulClient.emit<CreateProcessDto>(
  //       'ShopifyCheck',
  //       createProcess,
  //     );
  //   }
  // }

  // Scrap for shopProductById (check for a product for a certain website manually for testing)
  async checkForIndividualShopProduct(shopProductId: string): Promise<void> {
    const shopProduct = await this.shopProductRepository.findOne({
      where: {
        id: shopProductId,
        shop: {
          cloudflareEnhanced: false,
        },
      },
      relations: {
        shop: {
          sitemapEntity: true,
        },
        product: true,
        webPage: true,
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        candidatePages: {
          candidatePageCache: true,
        },
      },
    });

    // const reducedSitemap = this.shopService.reduceSitemap(
    //   shopProduct.shop.sitemapEntity.sitemapUrl.urls,
    //   shopProduct.product.name,
    // );

    // this.logger.debug(shopProduct.links);

    if (shopProduct) {
      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        shopProduct.links,
      );

      this.logger.debug(limitedUrls);

      if (limitedUrls.length === 0) {
        this.logger.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        throw new NotFoundException('no_urls_found_for_product');
      }

      // if (shopProduct.links.length === 0)
      //   throw new NotFoundException('no_links_found');

      const createProcess =
        this.createProcessDtoTemplateFromWebpageDiscoveryShopProduct(
          shopProduct,
          shopProduct.shop,
          limitedUrls,
        );

      if (shopProduct.shop.sitemapEntity.isShopifySite === true) {
        this.headlessClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else if (shopProduct.shop.headless === true) {
        this.headlessBrowserClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else if (shopProduct.shop.cloudflare === true) {
        this.headfulClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else {
        this.headfulClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      }
    }

    const shopProductEnhanced = await this.shopProductRepository.findOne({
      where: {
        id: shopProductId,
        shop: {
          cloudflareEnhanced: true,
        },
      },
      relations: {
        shop: {
          sitemapEntity: true,
        },
        product: true,
        webPage: true,
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        candidatePages: {
          candidatePageCache: true,
        },
      },
    });

    if (!shopProductEnhanced) return;

    const limitedUrlsEnhanced = await this.filteredLimitedUrls(
      shopProductEnhanced,
      shopProductEnhanced.links,
    );

    // this.logger.log(limitedUrls);

    if (limitedUrlsEnhanced.length === 0) {
      this.logger.log(
        `No URLs found for ${shopProductEnhanced.shop.name} - ${shopProductEnhanced.product.name}`,
      );
      throw new NotFoundException('no_urls_found_for_product');
    }

    // if (shopProduct.links.length === 0)
    //   throw new NotFoundException('no_links_found');

    const createProcessEnhanced =
      this.createProcessDtoTemplateFromWebpageDiscoveryShopProduct(
        shopProductEnhanced,
        shopProductEnhanced.shop,
        limitedUrlsEnhanced,
      );

    this.headfulSlowClient.emit<CreateProcessDto>('webpageDiscoveryHeadful', [
      createProcessEnhanced,
    ]);
  }

  async checkForIndividualShopProductPriority(
    shopProductId: string,
  ): Promise<void> {
    const shopProduct = await this.shopProductRepository.findOne({
      where: {
        id: shopProductId,
        shop: {
          cloudflareEnhanced: false,
        },
        product: {
          priority: true,
        },
      },
      relations: {
        shop: {
          sitemapEntity: true,
        },
        product: true,
        webPage: true,
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        candidatePages: {
          candidatePageCache: true,
        },
      },
    });

    // const reducedSitemap = this.shopService.reduceSitemap(
    //   shopProduct.shop.sitemapEntity.sitemapUrl.urls,
    //   shopProduct.product.name,
    // );

    // this.logger.debug(shopProduct.links);

    if (shopProduct) {
      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        shopProduct.links,
      );

      this.logger.debug(limitedUrls);

      if (limitedUrls.length === 0) {
        this.logger.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        throw new NotFoundException('no_urls_found_for_product');
      }

      // if (shopProduct.links.length === 0)
      //   throw new NotFoundException('no_links_found');

      const createProcess =
        this.createProcessDtoTemplateFromWebpageDiscoveryShopProduct(
          shopProduct,
          shopProduct.shop,
          limitedUrls,
        );

      if (shopProduct.shop.sitemapEntity.isShopifySite === true) {
        this.headlessClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else if (shopProduct.shop.headless === true) {
        this.headlessBrowserClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else if (shopProduct.shop.cloudflare === true) {
        this.headfulClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else {
        this.headfulClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      }
    }

    const shopProductEnhanced = await this.shopProductRepository.findOne({
      where: {
        id: shopProductId,
        shop: {
          cloudflareEnhanced: true,
        },
      },
      relations: {
        shop: {
          sitemapEntity: true,
        },
        product: true,
        webPage: true,
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        candidatePages: {
          candidatePageCache: true,
        },
      },
    });

    if (!shopProductEnhanced) return;

    const limitedUrlsEnhanced = await this.filteredLimitedUrls(
      shopProductEnhanced,
      shopProductEnhanced.links,
    );

    // this.logger.log(limitedUrls);

    if (limitedUrlsEnhanced.length === 0) {
      this.logger.log(
        `No URLs found for ${shopProductEnhanced.shop.name} - ${shopProductEnhanced.product.name}`,
      );
      throw new NotFoundException('no_urls_found_for_product');
    }

    // if (shopProduct.links.length === 0)
    //   throw new NotFoundException('no_links_found');

    const createProcessEnhanced =
      this.createProcessDtoTemplateFromWebpageDiscoveryShopProduct(
        shopProductEnhanced,
        shopProductEnhanced.shop,
        limitedUrlsEnhanced,
      );

    this.headfulSlowClient.emit<CreateProcessDto>('webpageDiscoveryHeadful', [
      createProcessEnhanced,
    ]);
  }

  // async checkForIndividualShopProductPriority(
  //   shopProductId: string,
  // ): Promise<void> {
  //   const shopProduct = await this.shopProductRepository.findOne({
  //     where: {
  //       id: shopProductId,
  //       product: {
  //         priority: true,
  //       },
  //     },
  //     relations: {
  //       shop: {
  //         sitemapEntity: true,
  //       },
  //       product: true,
  //       webPage: true,
  //       shopProductBlacklistUrls: {
  //         blackListUrl: true,
  //       },
  //       candidatePages: {
  //         candidatePageCache: true,
  //       },
  //     },
  //   });

  //   // const reducedSitemap = this.shopService.reduceSitemap(
  //   //   shopProduct.shop.sitemapEntity.sitemapUrl.urls,
  //   //   shopProduct.product.name,
  //   // );

  //   const limitedUrls = await this.filteredLimitedUrls(
  //     shopProduct,
  //     shopProduct.links,
  //   );

  //   if (limitedUrls.length === 0) {
  //     this.logger.log(
  //       `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
  //     );
  //     throw new NotFoundException('no_urls_found_for_product');
  //   }

  //   // if (shopProduct.links.length === 0)
  //   //   throw new NotFoundException('no_links_found');

  //   const createProcess: CreateProcessDto = {
  //     sitemap: shop.sitemap,
  //     url: shopProduct.shop.website,
  //     category: shopProduct.shop.category,
  //     name: shopProduct.product.name,
  //     shopProductId: shopProduct.id,
  //     shopWebsite: shopProduct.shop.name,
  //     type: shopProduct.product.type,
  //     context: shopProduct.product.context,
  //     crawlAmount: 90,
  //     productId: shopProduct.productId,
  //     shopId: shopProduct.shopId,
  //     shopifySite: shopProduct.shop.isShopifySite,
  //     shopType: shopProduct.shop.uniqueShopType,
  //     cloudflare: shopProduct.shop.cloudflare,
  //     headless: shopProduct.shop.headless,
  //     links: limitedUrls,
  //     expectedPrice: shopProduct.product.price,
  //     country: shopProduct.shop.country,
  //     currency: shopProduct.shop.currency,
  //     sitemapEntity: {
  //       ...shopProduct.shop.sitemapEntity,
  //       shopId: shop.id,
  //       sitemapUrls: [],
  //     },
  //     hash: shopProduct.candidatePages[0]?.candidatePageCache?.hash ?? '0',
  //     confirmed:
  //       shopProduct.candidatePages[0]?.candidatePageCache?.confirmed ?? false,
  //     count: shopProduct.candidatePages[0]?.candidatePageCache?.count ?? 0,
  //     candidatePages: shopProduct.candidatePages,
  //   };

  //   if (shopProduct.shop.isShopifySite === true) {
  //     this.headlessClient.emit<CreateProcessDto>(
  //       'webpageDiscovery',
  //       createProcess,
  //     );
  //   } else if (shopProduct.shop.headless === true) {
  //     this.headlessBrowserClient.emit<CreateProcessDto>(
  //       'webpageDiscovery',
  //       createProcess,
  //     );
  //   } else {
  //     this.headfulClient.emit<CreateProcessDto>(
  //       'webpageDiscovery',
  //       createProcess,
  //     );
  //   }
  // }

  // Check all shopProducts for shop
  // async checkForAllShopProductsFromShop(shopId: string): Promise<void> {
  //   const shopProducts = await this.shopProductRepository.find({
  //     where: {
  //       shopId,
  //     },
  //     relations: {
  //       shop: {
  //         sitemapEntity: true,
  //       },
  //       product: true,
  //       webPage: true,
  //       shopProductBlacklistUrls: {
  //         blackListUrl: true,
  //       },
  //       candidatePages: {
  //         candidatePageCache: true,
  //       },
  //     },
  //   });

  //   this.logger.log(shopProducts.length);

  //   for (const shopProduct of shopProducts) {
  //     // const reducedSitemap = this.shopService.reduceSitemap(
  //     //   shopProduct.shop.sitemapEntity.sitemapUrl.urls,
  //     //   shopProduct.product.name,
  //     // );
  //     await new Promise((r) => setTimeout(r, 6));

  //     const limitedUrls = await this.filteredLimitedUrls(
  //       shopProduct,
  //       shopProduct.links,
  //     );

  //     if (limitedUrls.length === 0) {
  //       this.logger.log(
  //         `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
  //       );
  //       continue;
  //     }

  //     // if (shopProduct.links.length === 0) {
  //     //   this.logger.log(
  //     //     `no_links_found ${shopProduct.shop.name} - ${shopProduct.product.name}`,
  //     //   );
  //     //   continue;
  //     // }

  //     const createProcess: CreateProcessDto = {
  //       sitemap: shop.sitemap,
  //       url: shopProduct.shop.website,
  //       category: shopProduct.shop.category,
  //       name: shopProduct.product.name,
  //       shopProductId: shopProduct.id,
  //       shopWebsite: shopProduct.shop.name,
  //       type: shopProduct.product.type,
  //       context: shopProduct.product.context,
  //       crawlAmount: 90,
  //       productId: shopProduct.productId,
  //       shopId: shopProduct.shopId,
  //       shopifySite: shopProduct.shop.isShopifySite,
  //       shopType: shopProduct.shop.uniqueShopType,
  //       cloudflare: shopProduct.shop.cloudflare,
  //       headless: shopProduct.shop.headless,
  //       links: limitedUrls,
  //       expectedPrice: shopProduct.product.price,
  //       country: shopProduct.shop.country,
  //       currency: shopProduct.shop.currency,
  //       sitemapEntity: {
  //         ...shopProduct.shop.sitemapEntity,
  //         shopId: shop.id,
  //         sitemapUrls: [],
  //       },
  //       hash: shopProduct.candidatePages[0]?.candidatePageCache?.hash ?? '0',
  //       confirmed:
  //         shopProduct.candidatePages[0]?.candidatePageCache?.confirmed ?? false,
  //       count: shopProduct.candidatePages[0]?.candidatePageCache?.count ?? 0,
  //       candidatePages: shopProduct.candidatePages,
  //     };

  //     if (
  //       shopProduct.shop.uniqueShopType === UniqueShopType.EBAY &&
  //       shopProduct.ebayProductDetail
  //     ) {
  //       createProcess.ebayProductDetail = {
  //         ebayProductDetailId: shopProduct.ebayProductDetail.id,
  //         productId: shopProduct.ebayProductDetail.productId,
  //       };
  //     }

  //     if (
  //       (shopProduct.shop.isShopifySite === true &&
  //         shopProduct.shop.cloudflare === false) ||
  //       (shopProduct.shop.cloudflare === false &&
  //         shopProduct.shop.headless === false)
  //     ) {
  //       this.headlessClient.emit<CreateProcessDto>(
  //         'webpageDiscovery',
  //         createProcess,
  //       );
  //     } else if (shopProduct.shop.cloudflareEnhanced === true) {
  //       this.headfulSlowClient.emit<CreateProcessDto>(
  //         'webpageDiscovery',
  //         createProcess,
  //       );
  //     } else if (shopProduct.shop.headless === true) {
  //       this.headlessBrowserClient.emit<CreateProcessDto>(
  //         'webpageDiscovery',
  //         createProcess,
  //       );
  //     } else {
  //       this.headfulClient.emit<CreateProcessDto>(
  //         'webpageDiscovery',
  //         createProcess,
  //       );
  //     }
  //   }
  // }

  findAll(): Promise<ShopProduct[]> {
    return this.shopProductRepository.find({});
  }

  async findAllPopulatedWebpageNull() {
    const shopProducts = await this.shopProductRepository.find({
      where: {
        populated: true,
      },
      relations: {
        webPage: true,
      },
    });

    const shopProductsFilter = shopProducts.filter((sp) => sp.webPage === null);
    shopProductsFilter.forEach((sp) => (sp.populated = false));

    await this.shopProductRepository.save(shopProductsFilter);
  }

  async findOne(id: string): Promise<ShopProduct> {
    return this.shopProductRepository.findOne({
      where: { id },
      relations: {
        webPage: {
          webpageCache: true,
        },
        candidatePages: {
          candidatePageCache: true,
        },
        shop: true,
        product: true,
      },
    });
  }

  async findOneWithUrls(id: string): Promise<ShopProduct> {
    return this.shopProductRepository.findOne({
      where: { id },
      relations: {
        webPage: {
          webpageCache: true,
        },
        shop: {
          sitemapEntity: {
            sitemapUrl: {
              urls: true,
            },
          },
        },
        candidatePages: {
          candidatePageCache: true,
        },
        product: true,
      },
    });
  }

  async isUrlBlacklistedForShopProduct(
    url: string,
    shopProductId: string,
  ): Promise<boolean> {
    return this.shopProductRepository.exists({
      where: {
        id: shopProductId,
        shopProductBlacklistUrls: {
          blackListUrl: {
            url,
          },
        },
      },
      relations: {
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
      },
    });
  }

  async findOneByShopProductName(name: string): Promise<ShopProduct> {
    this.logger.log(name);
    return this.shopProductRepository.findOne({
      where: {
        shop: {
          name,
        },
      },
    });
  }

  async findOneByProductId(
    productId: string,
    shopId: string,
  ): Promise<ShopProduct> {
    return this.shopProductRepository.findOne({
      where: {
        productId,
        shopId,
      },
      relations: {
        product: true,
        shop: true,
      },
    });
  }

  async findOneByWebpageId(webpageId: string) {
    return this.shopProductRepository.findOne({
      where: {
        webPage: {
          id: webpageId,
        },
      },
      relations: {
        webPage: true,
      },
    });
  }

  async findAllByWebpageId(webpageId: string) {
    return this.shopProductRepository.find({
      where: {
        webPage: {
          id: webpageId,
        },
      },
      relations: {
        webPage: true,
      },
    });
  }

  async findOneByWebpageUrl(webpageUrl: string) {
    return this.shopProductRepository.findOne({
      where: {
        webPage: {
          url: webpageUrl,
        },
      },
      relations: {
        webPage: true,
      },
    });
  }

  async findOneByCandidatePageId(candidatePageId: string) {
    return this.shopProductRepository.findOne({
      where: {
        candidatePages: {
          id: candidatePageId,
        },
      },
      relations: {
        candidatePages: true,
      },
    });
  }

  async findOneByCandidatePageUrl(candidatePageUrl: string) {
    return this.shopProductRepository.findOne({
      where: {
        candidatePages: {
          url: candidatePageUrl,
        },
      },
      relations: {
        candidatePages: true,
      },
    });
  }

  async removeCandidatePageFromShopProduct(webpageUrl: string) {
    this.logger.log(webpageUrl);
    const shopProductEntity = await this.shopProductRepository.findOne({
      where: {
        candidatePages: {
          url: webpageUrl,
        },
      },
      relations: {
        candidatePages: true,
      },
    });

    this.logger.log(shopProductEntity);

    for (const candidatePage of shopProductEntity.candidatePages) {
      this.eventemitter.emit('remove.candidatePage', candidatePage.id);
    }

    // if (shopProductEntity) {
    //   shopProductEntity.candidatePages = null;
    //   await this.shopProductRepository.save(shopProductEntity);
    // }
  }

  async update(
    id: string,
    updateShopProductDto: UpdateShopProductDto,
  ): Promise<UpdateResult> {
    this.logger.log(updateShopProductDto);
    return this.shopProductRepository.update({ id }, updateShopProductDto);
  }

  async updateLinks(
    id: string,
    updateShopProductDto: UpdateShopProductDto,
  ): Promise<UpdateResult> {
    const updateResult = await this.shopProductRepository.update(
      { id },
      updateShopProductDto,
    );
    this.logger.log('updateLinks called');
    await this.checkForIndividualShopProduct(id);
    // await this.checkForIndividualShopProductPriority(id);
    return updateResult;
  }

  async updateLinksPriority(
    id: string,
    updateShopProductDto: UpdateShopProductDto,
  ): Promise<UpdateResult> {
    const updateResult = await this.shopProductRepository.update(
      { id },
      updateShopProductDto,
    );
    this.logger.log('updateLinks called');
    // await this.checkForIndividualShopProduct(id);
    await this.checkForIndividualShopProductPriority(id);
    return updateResult;
  }

  async remove(id: string): Promise<ShopProduct> {
    const shopProductEntity = await this.findOne(id);
    return this.shopProductRepository.remove(shopProductEntity);
  }

  createProcessDtoTemplateFromFindLinksShopProduct(
    shopProduct: ShopProduct,
    shop: Shop,
    urls: string[],
  ) {
    const createProcess: CreateProcessDto = {
      sitemap: shop.sitemap,
      url: shop.website,
      category: shop.category,
      name: shopProduct.product.name,
      shopProductId: shopProduct.id,
      shopWebsite: shop.name,
      type: shopProduct.product.type,
      context: shopProduct.product.context,
      crawlAmount: 90,
      productId: shopProduct.product.id,
      shopId: shop.id,
      shopifySite: shop.isShopifySite,
      shopType: shop.uniqueShopType,
      cloudflare: shop.cloudflare,
      headless: shop.headless,
      expectedPrice: shopProduct.product.price,
      country: shop.country,
      currency: shop.currency,
      links: [],
      wordpressXml: shop.sitemapEntity.wordpressXml,
      sitemapEntity: {
        sitemap: shop.sitemap,
        shopId: shop.id,
        sitemapUrls: urls,
        isShopifySite: shop.isShopifySite,
      },
      hash: shopProduct.candidatePages?.[0]?.candidatePageCache?.hash ?? '0',
      confirmed:
        shopProduct.candidatePages?.[0]?.candidatePageCache?.confirmed ?? false,
      count: shopProduct.candidatePages?.[0]?.candidatePageCache?.count ?? 0,
      candidatePages: shopProduct.candidatePages ?? [],
    };
    return createProcess;
  }

  createProcessDtoTemplateFromWebpageDiscoveryShopProduct(
    shopProduct: ShopProduct,
    shop: Shop,
    urls: string[],
  ) {
    const createProcess: CreateProcessDto = {
      sitemap: shop.sitemap,
      url: shop.website,
      category: shop.category,
      name: shopProduct.product.name,
      shopProductId: shopProduct.id,
      shopWebsite: shop.name,
      type: shopProduct.product.type,
      context: shopProduct.product.context,
      crawlAmount: 90,
      productId: shopProduct.product.id,
      shopId: shop.id,
      shopifySite: shop.sitemapEntity.isShopifySite,
      shopType: shop.uniqueShopType,
      cloudflare: shop.cloudflare,
      headless: shop.headless,
      expectedPrice: shopProduct.product.price,
      country: shop.country,
      currency: shop.currency,
      links: urls,
      wordpressXml: shop.sitemapEntity.wordpressXml,

      sitemapEntity: {
        sitemap: shop.sitemap,
        shopId: shop.id,
        sitemapUrls: [],
        isShopifySite: shop.sitemapEntity.isShopifySite,
      },
      hash: shopProduct.candidatePages?.[0]?.candidatePageCache?.hash ?? '0',
      confirmed:
        shopProduct.candidatePages?.[0]?.candidatePageCache?.confirmed ?? false,
      count: shopProduct.candidatePages?.[0]?.candidatePageCache?.count ?? 0,
      candidatePages: shopProduct.candidatePages ?? [],
    };
    return createProcess;
  }
}
