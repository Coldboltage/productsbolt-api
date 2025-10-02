import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateShopProductDto } from './dto/update-shop-product.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ShopProduct } from './entities/shop-product.entity';
import { FindManyOptions, Repository, UpdateResult } from 'typeorm';
import { ShopService } from '../shop/shop.service';
import { Product } from '../product/entities/product.entity';
import { ClientProxy } from '@nestjs/microservices';
import { ProductService } from '../product/product.service';
import { CreateProcessDto } from '../shop/dto/create-process.dto';
import { Shop, UniqueShopType } from '../shop/entities/shop.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ShopProductService {
  constructor(
    @Inject('HEADFUL_CLIENT') private headfulClient: ClientProxy,
    @Inject('HEADLESS_CLIENT') private headlessClient: ClientProxy,

    @InjectRepository(ShopProduct)
    private shopProductRepository: Repository<ShopProduct>,
    private shopService: ShopService,
    private productService: ProductService,
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
  }

  @OnEvent('product.created')
  async findShopsToUpdateProducts(product: Product): Promise<ShopProduct[]> {
    const shopsEntities = await this.shopService.findAll();
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
    for (const shopProduct of shopProductResponses) {
      const reducedSitemap = this.shopService.reduceSitemap(
        shopProduct.shop.sitemapEntity.sitemapUrls,
        shopProduct.product.name,
      );

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        reducedSitemap,
      );

      console.log(`Adding new product: ${shopProduct.product.name}`);
      const createProcess: CreateProcessDto = {
        sitemap: shopProduct.shop.sitemap,
        url: shopProduct.shop.website,
        category: shopProduct.shop.category,
        name: shopProduct.product.name,
        shopProductId: shopProduct.id,
        shopWebsite: shopProduct.shop.name,
        type: shopProduct.product.type,
        context: shopProduct.product.context,
        crawlAmount: 90,
        productId: shopProduct.product.id,
        shopId: shopProduct.shop.id,
        shopifySite: shopProduct.shop.isShopifySite,
        shopType: shopProduct.shop.uniqueShopType,
        cloudflare: shopProduct.shop.cloudflare,
        links: [],
        sitemapEntity: {
          ...shopProduct.shop.sitemapEntity,
          shopId: shopProduct.shop.id,
          sitemapUrls: limitedUrls,
        },
      };

      if (shopProduct.shop.isShopifySite === true) {
        this.headlessClient.emit<CreateProcessDto>(
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
    return shopProductResponses;
  }

  @OnEvent('shop.created')
  async newShopCreated(shop: Shop): Promise<ShopProduct[]> {
    console.log(`Added Shop: ${shop.name}`);
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
    console.log(response);
    return response;
  }

  // Individual get links
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
          sitemapEntity: true,
        },
        webPage: true,
        blacklistUrls: true,
      },
    };

    if (!bypass) {
      whereClause.where['populated'] = false;
    }

    const shopProduct = await this.shopProductRepository.findOne(whereClause);

    console.log(shopProduct);

    if (!shopProduct)
      throw new NotFoundException('shop_product_not_found_or_populated');

    const reducedSitemap = this.shopService.reduceSitemap(
      shopProduct.shop.sitemapEntity.sitemapUrls,
      shopProduct.product.name,
    );

    console.log(shopProduct.product.name);

    if (reducedSitemap.length === 0)
      throw new Error('no_urls_found_for_product');

    const limitedUrls = await this.filteredLimitedUrls(
      shopProduct,
      reducedSitemap,
    );

    const createProcess: CreateProcessDto = {
      sitemap: shopProduct.shop.sitemap,
      url: shopProduct.shop.website,
      category: shopProduct.shop.category,
      name: shopProduct.product.name,
      shopProductId: shopProduct.id,
      shopWebsite: shopProduct.shop.name,
      type: shopProduct.product.type,
      context: shopProduct.product.context,
      crawlAmount: 90,
      productId: shopProduct.productId,
      shopId: shopProduct.shopId,
      shopifySite: shopProduct.shop.isShopifySite,
      shopType: shopProduct.shop.uniqueShopType,
      cloudflare: shopProduct.shop.cloudflare,
      links: [],
      sitemapEntity: {
        ...shopProduct.shop.sitemapEntity,
        sitemapUrls: limitedUrls,
        shopId: shopProduct.shop.id,
      },
    };

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
    //   console.log('shopifySiteFound');
    //   this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);
    // } else {
    //   console.log('normal setup');
    //   this.headfulClient.emit<CreateProcessDto>('findLinks', createProcess);
    // }
    await new Promise((r) => setTimeout(r, 100));
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
          sitemapEntity: true,
        },
        webPage: true,
        blacklistUrls: true,
      },
    };

    if (!scanAll) {
      whereClause.where['populated'] = false;
    }

    const shopProductsOrphan = await (
      await this.shopProductRepository.find(whereClause)
    ).sort(() => Math.random() - 0.5);
    console.log(shopProductsOrphan.length);

    for (const shopProduct of shopProductsOrphan) {
      if (!shopProduct) continue;

      const reducedSitemap = this.shopService.reduceSitemap(
        shopProduct.shop.sitemapEntity.sitemapUrls,
        shopProduct.product.name,
      );

      if (reducedSitemap.length === 0) continue;

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        reducedSitemap,
      );

      if (limitedUrls.length === 0) {
        console.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      const createProcess: CreateProcessDto = {
        sitemap: shopProduct.shop.sitemap,
        url: shopProduct.shop.website,
        category: shopProduct.shop.category,
        name: shopProduct.product.name,
        shopProductId: shopProduct.id,
        shopWebsite: shopProduct.shop.name,
        type: shopProduct.product.type,
        context: shopProduct.product.context,
        crawlAmount: 90,
        productId: shopProduct.productId,
        shopId: shopProduct.shopId,
        shopifySite: shopProduct.shop.isShopifySite,
        shopType: shopProduct.shop.uniqueShopType,
        cloudflare: shopProduct.shop.cloudflare,
        links: [],
        sitemapEntity: {
          ...shopProduct.shop.sitemapEntity,
          sitemapUrls: limitedUrls,
          shopId: shopProduct.shop.id,
        },
      };

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
      //   console.log('shopifySiteFound');
      //   this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);
      // } else {
      //   console.log('normal setup');
      //   this.headfulClient.emit<CreateProcessDto>('findLinks', createProcess);
      // }
      await new Promise((r) => setTimeout(r, 1));
    }
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
          sitemapEntity: true,
        },
        webPage: true,
        blacklistUrls: true,
      },
    };

    if (!scanAll) {
      whereClause.where['populated'] = false;
    }

    const shopProductsOrphan = await (
      await this.shopProductRepository.find(whereClause)
    ).sort(() => Math.random() - 0.5);
    console.log(shopProductsOrphan.length);

    for (const shopProduct of shopProductsOrphan) {
      if (!shopProduct) continue;

      const reducedSitemap = this.shopService.reduceSitemap(
        shopProduct.shop.sitemapEntity.sitemapUrls,
        shopProduct.product.name,
      );

      if (reducedSitemap.length === 0) continue;

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        reducedSitemap,
      );

      if (limitedUrls.length === 0) {
        console.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name} but was found in reduced sitemap: ${reducedSitemap}`,
        );
        continue;
      }

      const createProcess: CreateProcessDto = {
        sitemap: shopProduct.shop.sitemap,
        url: shopProduct.shop.website,
        category: shopProduct.shop.category,
        name: shopProduct.product.name,
        shopProductId: shopProduct.id,
        shopWebsite: shopProduct.shop.name,
        type: shopProduct.product.type,
        context: shopProduct.product.context,
        crawlAmount: 90,
        productId: shopProduct.productId,
        shopId: shopProduct.shopId,
        shopifySite: shopProduct.shop.isShopifySite,
        shopType: shopProduct.shop.uniqueShopType,
        cloudflare: shopProduct.shop.cloudflare,
        links: [],
        sitemapEntity: {
          ...shopProduct.shop.sitemapEntity,
          sitemapUrls: limitedUrls,
          shopId: shopProduct.shop.id,
        },
      };

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
      //   console.log('shopifySiteFound');
      //   this.headlessClient.emit<CreateProcessDto>('findLinks', createProcess);
      // } else {
      //   console.log('normal setup');
      //   this.headfulClient.emit<CreateProcessDto>('findLinks', createProcess);
      // }
      await new Promise((r) => setTimeout(r, 1));
    }
  }

  @Cron('0 1-23/2 * * *', { timeZone: 'Europe/London' })
  async manualUpdateAllShopProducts(): Promise<string> {
    this.manualUpdateAllShopProductsEvent();
    return 'manualUpdateAllShopProductsEvent fired';
  }

  async manualUpdateAllShopProductsImmediate(): Promise<void> {
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
          blacklistUrls: true,
        },
      })
    ).sort(() => Math.random() - 0.5);
    console.log(shopProductsOrphan.length);

    for (const shopProduct of shopProductsOrphan) {
      const reducedSitemap = this.shopService.reduceSitemap(
        shopProduct.shop.sitemapEntity.sitemapUrls,
        shopProduct.product.name,
      );

      if (reducedSitemap.length === 0) continue;

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        reducedSitemap,
      );

      if (limitedUrls.length === 0) {
        console.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      if (shopProduct.links.length === 0) {
        console.log(
          `no_links_found ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      const createProcess: CreateProcessDto = {
        sitemap: shopProduct.shop.sitemap,
        url: shopProduct.shop.website,
        category: shopProduct.shop.category,
        name: shopProduct.product.name,
        shopProductId: shopProduct.id,
        shopWebsite: shopProduct.shop.name,
        type: shopProduct.product.type,
        context: shopProduct.product.context,
        crawlAmount: 90,
        productId: shopProduct.productId,
        shopId: shopProduct.shopId,
        shopifySite: shopProduct.shop.isShopifySite,
        shopType: shopProduct.shop.uniqueShopType,
        cloudflare: shopProduct.shop.cloudflare,
        links: shopProduct.links,
        sitemapEntity: {
          ...shopProduct.shop.sitemapEntity,
          sitemapUrls: limitedUrls,
          shopId: shopProduct.shop.id,
        },
      };

      if (
        shopProduct.shop.uniqueShopType === UniqueShopType.EBAY &&
        shopProduct.ebayProductDetail
      ) {
        createProcess.ebayProductDetail = {
          ebayProductDetailId: shopProduct.ebayProductDetail.id,
          productId: shopProduct.ebayProductDetail.productId,
        };
      }

      if (shopProduct.shop.isShopifySite === true) {
        console.log('shopifySiteFound');
        this.headlessClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      } else {
        console.log('normal setup');
        this.headfulClient.emit<CreateProcessDto>(
          'webpageDiscovery',
          createProcess,
        );
      }
      await new Promise((r) => setTimeout(r, 100));
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
          blacklistUrls: true,
        },
      })
    ).sort(() => Math.random() - 0.5);
    console.log(shopProductsOrphan.length);

    let index = 0;

    while (index < shopProductsOrphan.length) {
      const shopProductsOrphanSlice = shopProductsOrphan.slice(
        index,
        index + 40,
      );

      for (const shopProduct of shopProductsOrphanSlice) {
        const reducedSitemap = this.shopService.reduceSitemap(
          shopProduct.shop.sitemapEntity.sitemapUrls,
          shopProduct.product.name,
        );

        if (reducedSitemap.length === 0) continue;

        const limitedUrls = await this.filteredLimitedUrls(
          shopProduct,
          reducedSitemap,
        );

        if (limitedUrls.length === 0) {
          console.log(
            `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
          );
          continue;
        }

        if (shopProduct.links.length === 0) {
          console.log(
            `no_links_found ${shopProduct.shop.name} - ${shopProduct.product.name}`,
          );
          continue;
        }

        const createProcess: CreateProcessDto = {
          sitemap: shopProduct.shop.sitemap,
          url: shopProduct.shop.website,
          category: shopProduct.shop.category,
          name: shopProduct.product.name,
          shopProductId: shopProduct.id,
          shopWebsite: shopProduct.shop.name,
          type: shopProduct.product.type,
          context: shopProduct.product.context,
          crawlAmount: 90,
          productId: shopProduct.productId,
          shopId: shopProduct.shopId,
          shopifySite: shopProduct.shop.isShopifySite,
          shopType: shopProduct.shop.uniqueShopType,
          cloudflare: shopProduct.shop.cloudflare,
          links: shopProduct.links,
          sitemapEntity: {
            ...shopProduct.shop.sitemapEntity,
            sitemapUrls: limitedUrls,
            shopId: shopProduct.shop.id,
          },
        };

        if (
          shopProduct.shop.uniqueShopType === UniqueShopType.EBAY &&
          shopProduct.ebayProductDetail
        ) {
          createProcess.ebayProductDetail = {
            ebayProductDetailId: shopProduct.ebayProductDetail.id,
            productId: shopProduct.ebayProductDetail.productId,
          };
        }

        if (shopProduct.shop.isShopifySite === true) {
          console.log('shopifySiteFound');
          this.headlessClient.emit<CreateProcessDto>(
            'webpageDiscovery',
            createProcess,
          );
        } else {
          console.log('normal setup');
          this.headfulClient.emit<CreateProcessDto>(
            'webpageDiscovery',
            createProcess,
          );
        }
        await new Promise((r) => setTimeout(r, 100));
      }

      index += 40;

      if (index < shopProductsOrphan.length) {
        console.log(
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
    const blackListUrls = shopProduct.blacklistUrls.map(
      (blacklist) => blacklist.url,
    );

    const shopEntity = await this.shopService.findOne(shopProduct.shopId);

    const shopProductUrlList = shopEntity.shopProducts
      .filter((shopProduct) => {
        if (shopProduct.webPage) return shopProduct.webPage.url;
      })
      .map((shopProduct) => shopProduct.webPage.url);

    const restrictedUrls = [...blackListUrls, ...shopProductUrlList];

    const limitedUrls = reducedSitemap.filter((url: string) => {
      return !restrictedUrls.includes(url);
    });

    return limitedUrls;
  }

  async manualFindShopsToUpdateProducts(productId: string): Promise<void> {
    const product = await this.productService.findOne(productId);
    console.log(`Adding new product: ${product.name}`);

    const shopProductsOrphan = await this.shopProductRepository.find({
      where: {
        populated: false,
        shop: {
          active: true,
        },
        productId: productId,
      },
      relations: {
        shop: {
          sitemapEntity: true,
        },
        webPage: true,
        blacklistUrls: true,
        product: true,
      },
    });

    console.log(shopProductsOrphan.length);

    for (const shopProduct of shopProductsOrphan) {
      const reducedSitemap = this.shopService.reduceSitemap(
        shopProduct.shop.sitemapEntity.sitemapUrls,
        shopProduct.product.name,
      );

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        reducedSitemap,
      );

      if (limitedUrls.length === 0) {
        console.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      if (shopProduct.links.length === 0) {
        console.log(
          `no_links_found ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      const createProcess: CreateProcessDto = {
        sitemap: shopProduct.shop.sitemap,
        url: shopProduct.shop.website,
        category: shopProduct.shop.category,
        name: product.name,
        shopProductId: shopProduct.id,
        shopWebsite: shopProduct.shop.name,
        type: product.type,
        context: product.context,
        crawlAmount: 90,
        productId: shopProduct.productId,
        shopId: shopProduct.shopId,
        shopifySite: shopProduct.shop.isShopifySite,
        shopType: shopProduct.shop.uniqueShopType,
        cloudflare: shopProduct.shop.cloudflare,
        links: shopProduct.links,
        sitemapEntity: {
          ...shopProduct.shop.sitemapEntity,
          sitemapUrls: limitedUrls,
          shopId: shopProduct.shop.id,
        },
      };

      if (
        shopProduct.shop.uniqueShopType === UniqueShopType.EBAY &&
        shopProduct.ebayProductDetail
      ) {
        createProcess.ebayProductDetail = {
          ebayProductDetailId: shopProduct.ebayProductDetail.id,
          productId: shopProduct.ebayProductDetail.productId,
        };
      }

      if (shopProduct.shop.sitemapEntity.isShopifySite === true) {
        this.headlessClient.emit<CreateProcessDto>(
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
  }

  async manuallyUpdateShopProductsByShopId(shopId: string): Promise<void> {
    const shop = await this.shopService.findOne(shopId);
    console.log(`Adding new product: ${shop.name}`);

    const shopProductsOrphan = await this.shopProductRepository.find({
      where: {
        populated: false,
        shop: {
          active: true,
          id: shopId,
        },
      },
      relations: {
        shop: {
          sitemapEntity: true,
        },
        webPage: true,
        blacklistUrls: true,
        product: true,
      },
    });

    console.log(shopProductsOrphan.length);

    for (const shopProduct of shopProductsOrphan) {
      const reducedSitemap = this.shopService.reduceSitemap(
        shopProduct.shop.sitemapEntity.sitemapUrls,
        shopProduct.product.name,
      );

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        reducedSitemap,
      );

      if (limitedUrls.length === 0) {
        console.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      if (shopProduct.links.length === 0) {
        console.log(
          `no_links_found ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      const createProcess: CreateProcessDto = {
        sitemap: shopProduct.shop.sitemap,
        url: shopProduct.shop.website,
        category: shopProduct.shop.category,
        name: shopProduct.product.name,
        shopProductId: shopProduct.id,
        shopWebsite: shopProduct.shop.name,
        type: shopProduct.product.type,
        context: shopProduct.product.context,
        crawlAmount: 90,
        productId: shopProduct.productId,
        shopId: shopProduct.shopId,
        shopifySite: shopProduct.shop.isShopifySite,
        shopType: shopProduct.shop.uniqueShopType,
        cloudflare: shopProduct.shop.cloudflare,
        links: shopProduct.links,
        sitemapEntity: {
          ...shopProduct.shop.sitemapEntity,
          sitemapUrls: limitedUrls,
          shopId: shopProduct.shop.id,
        },
      };

      if (
        shopProduct.shop.uniqueShopType === UniqueShopType.EBAY &&
        shopProduct.ebayProductDetail
      ) {
        createProcess.ebayProductDetail = {
          ebayProductDetailId: shopProduct.ebayProductDetail.id,
          productId: shopProduct.ebayProductDetail.productId,
        };
      }

      if (shopProduct.shop.sitemapEntity.isShopifySite === true) {
        this.headlessClient.emit<CreateProcessDto>(
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
  }

  // async manualCheckAllShopsShopfiy() {
  //   const shopProdutEntities = await this.findOneWebPageFromShop()
  //   console.log(shopProdutEntities.length);

  //   for (const shopProduct of shopProdutEntities) {
  //     const createProcess: CreateProcessDto = {
  //       sitemap: shopProduct.shop.sitemap,
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
      },
      relations: {
        shop: {
          sitemapEntity: true,
        },
        product: true,
        webPage: true,
        blacklistUrls: true,
      },
    });

    const reducedSitemap = this.shopService.reduceSitemap(
      shopProduct.shop.sitemapEntity.sitemapUrls,
      shopProduct.product.name,
    );

    const limitedUrls = await this.filteredLimitedUrls(
      shopProduct,
      reducedSitemap,
    );

    console.log(limitedUrls);

    if (limitedUrls.length === 0) {
      console.log(
        `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
      );
      throw new NotFoundException('no_urls_found_for_product');
    }

    if (shopProduct.links.length === 0)
      throw new NotFoundException('no_links_found');

    const createProcess: CreateProcessDto = {
      sitemap: shopProduct.shop.sitemap,
      url: shopProduct.shop.website,
      category: shopProduct.shop.category,
      name: shopProduct.product.name,
      shopProductId: shopProduct.id,
      shopWebsite: shopProduct.shop.name,
      type: shopProduct.product.type,
      context: shopProduct.product.context,
      crawlAmount: 90,
      productId: shopProduct.productId,
      shopId: shopProduct.shopId,
      shopifySite: shopProduct.shop.isShopifySite,
      shopType: shopProduct.shop.uniqueShopType,
      cloudflare: shopProduct.shop.cloudflare,
      links: shopProduct.links,
      sitemapEntity: {
        ...shopProduct.shop.sitemapEntity,
        shopId: shopProduct.shop.id,
        sitemapUrls: limitedUrls,
      },
    };

    if (shopProduct.shop.isShopifySite === true) {
      this.headlessClient.emit<CreateProcessDto>(
        'webpageDiscovery',
        createProcess,
      );
    } else if (shopProduct.shop.cloudflare === true) {
      this.headlessClient.emit<CreateProcessDto>(
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

  async checkForIndividualShopProductPriority(
    shopProductId: string,
  ): Promise<void> {
    const shopProduct = await this.shopProductRepository.findOne({
      where: {
        id: shopProductId,
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
        blacklistUrls: true,
      },
    });

    const reducedSitemap = this.shopService.reduceSitemap(
      shopProduct.shop.sitemapEntity.sitemapUrls,
      shopProduct.product.name,
    );

    const limitedUrls = await this.filteredLimitedUrls(
      shopProduct,
      reducedSitemap,
    );

    if (limitedUrls.length === 0) {
      console.log(
        `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
      );
      throw new NotFoundException('no_urls_found_for_product');
    }

    if (shopProduct.links.length === 0)
      throw new NotFoundException('no_links_found');

    const createProcess: CreateProcessDto = {
      sitemap: shopProduct.shop.sitemap,
      url: shopProduct.shop.website,
      category: shopProduct.shop.category,
      name: shopProduct.product.name,
      shopProductId: shopProduct.id,
      shopWebsite: shopProduct.shop.name,
      type: shopProduct.product.type,
      context: shopProduct.product.context,
      crawlAmount: 90,
      productId: shopProduct.productId,
      shopId: shopProduct.shopId,
      shopifySite: shopProduct.shop.isShopifySite,
      shopType: shopProduct.shop.uniqueShopType,
      cloudflare: shopProduct.shop.cloudflare,
      links: shopProduct.links,
      sitemapEntity: {
        ...shopProduct.shop.sitemapEntity,
        shopId: shopProduct.shop.id,
        sitemapUrls: limitedUrls,
      },
    };

    if (shopProduct.shop.isShopifySite === true) {
      this.headlessClient.emit<CreateProcessDto>(
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

  // Check all shopProducts for shop
  async checkForAllShopProductsFromShop(shopId: string): Promise<void> {
    const shopProducts = await this.shopProductRepository.find({
      where: {
        shopId,
      },
      relations: {
        shop: {
          sitemapEntity: true,
        },
        product: true,
        webPage: true,
        blacklistUrls: true,
      },
    });

    console.log(shopProducts.length);

    for (const shopProduct of shopProducts) {
      const reducedSitemap = this.shopService.reduceSitemap(
        shopProduct.shop.sitemapEntity.sitemapUrls,
        shopProduct.product.name,
      );

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        reducedSitemap,
      );

      if (limitedUrls.length === 0) {
        console.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      if (shopProduct.links.length === 0) {
        console.log(
          `no_links_found ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      const createProcess: CreateProcessDto = {
        sitemap: shopProduct.shop.sitemap,
        url: shopProduct.shop.website,
        category: shopProduct.shop.category,
        name: shopProduct.product.name,
        shopProductId: shopProduct.id,
        shopWebsite: shopProduct.shop.name,
        type: shopProduct.product.type,
        context: shopProduct.product.context,
        crawlAmount: 90,
        productId: shopProduct.productId,
        shopId: shopProduct.shopId,
        shopifySite: shopProduct.shop.isShopifySite,
        shopType: shopProduct.shop.uniqueShopType,
        cloudflare: shopProduct.shop.cloudflare,
        links: shopProduct.links,
        sitemapEntity: {
          ...shopProduct.shop.sitemapEntity,
          shopId: shopProduct.shop.id,
          sitemapUrls: limitedUrls,
        },
      };

      if (
        shopProduct.shop.uniqueShopType === UniqueShopType.EBAY &&
        shopProduct.ebayProductDetail
      ) {
        createProcess.ebayProductDetail = {
          ebayProductDetailId: shopProduct.ebayProductDetail.id,
          productId: shopProduct.ebayProductDetail.productId,
        };
      }

      if (shopProduct.shop.isShopifySite === true) {
        this.headlessClient.emit<CreateProcessDto>(
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
  }

  findAll(): Promise<ShopProduct[]> {
    return this.shopProductRepository.find({});
  }

  findOne(id: string): Promise<ShopProduct> {
    return this.shopProductRepository.findOne({ where: { id } });
  }

  async isUrlBlacklistedForShopProduct(
    url: string,
    shopProductId: string,
  ): Promise<boolean> {
    return this.shopProductRepository.exists({
      where: {
        id: shopProductId,
        blacklistUrls: {
          url,
        },
      },
      relations: { blacklistUrls: true },
    });
  }

  async findOneByShopProductName(name: string): Promise<ShopProduct> {
    console.log(name);
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
      },
    });
  }

  async update(
    id: string,
    updateShopProductDto: UpdateShopProductDto,
  ): Promise<UpdateResult> {
    console.log(updateShopProductDto);
    return this.shopProductRepository.update({ id }, updateShopProductDto);
  }

  async updateLinks(
    id: string,
    updateShopProductDto: UpdateShopProductDto,
  ): Promise<UpdateResult> {
    console.log(updateShopProductDto);
    const updateResult = await this.shopProductRepository.update(
      { id },
      updateShopProductDto,
    );
    await this.checkForIndividualShopProduct(id);
    return updateResult;
  }

  async remove(id: string): Promise<ShopProduct> {
    const shopProductEntity = await this.findOne(id);
    return this.shopProductRepository.remove(shopProductEntity);
  }
}
