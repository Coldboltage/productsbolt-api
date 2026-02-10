import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateShopProductDto } from './dto/update-shop-product.dto';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ShopProduct } from './entities/shop-product.entity';
import { FindManyOptions, Repository, UpdateResult } from 'typeorm';
import { ShopService } from '../shop/shop.service';
import { Product } from '../product/entities/product.entity';
import { ClientProxy } from '@nestjs/microservices';
import { ProductService } from '../product/product.service';
import { CreateProcessDto } from '../shop/dto/create-process.dto';
import { Shop, UniqueShopType } from '../shop/entities/shop.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ShopProductService {
  constructor(
    @Inject('HEADFUL_CLIENT') private headfulClient: ClientProxy,
    @Inject('HEADLESS_CLIENT') private headlessClient: ClientProxy,

    @InjectRepository(ShopProduct)
    private shopProductRepository: Repository<ShopProduct>,
    private shopService: ShopService,
    private productService: ProductService,
    private eventemitter: EventEmitter2,
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
        shopProduct.shop.sitemapEntity.sitemapUrl.urls,
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
        expectedPrice: shopProduct.product.price,
        links: [],
        sitemapEntity: {
          ...shopProduct.shop.sitemapEntity,
          shopId: shopProduct.shop.id,
          sitemapUrls: limitedUrls,
        },
        hash: shopProduct.candidatePages[0]?.candidatePageCache?.hash ?? '0',
        confirmed:
          shopProduct.candidatePages[0]?.candidatePageCache?.confirmed ?? false,
        count: shopProduct.candidatePages[0]?.candidatePageCache?.count ?? 0,
        candidatePages: shopProduct.candidatePages,
      };

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

    // console.log(shopProduct);

    if (!shopProduct)
      throw new NotFoundException('shop_product_not_found_or_populated');

    const reducedSitemap = this.shopService.reduceSitemap(
      shopProduct.shop.sitemapEntity.sitemapUrl.urls,
      shopProduct.product.name,
    );

    console.log(shopProduct.product.name);

    if (reducedSitemap.length === 0)
      throw new Error('no_urls_found_for_product');

    const limitedUrls = await this.filteredLimitedUrls(
      shopProduct,
      reducedSitemap,
    );

    if (limitedUrls.length === 0) {
      console.log(
        `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name} but was found in reduced sitemap: ${reducedSitemap}`,
      );
      throw new NotFoundException(`No URLs found for ${shopProduct.shop.name}`);
    }

    // console.log(limitedUrls);
    // await new Promise((r) => setTimeout(r, 2000000));

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
      expectedPrice: shopProduct.product.price,
      links: [],
      sitemapEntity: {
        ...shopProduct.shop.sitemapEntity,
        sitemapUrls: limitedUrls,
        shopId: shopProduct.shop.id,
      },
      hash: shopProduct.candidatePages[0]?.candidatePageCache?.hash ?? '0',
      confirmed:
        shopProduct.candidatePages[0]?.candidatePageCache?.confirmed ?? false,
      count: shopProduct.candidatePages[0]?.candidatePageCache?.count ?? 0,
      candidatePages: shopProduct.candidatePages,
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
    };

    const shopProductsOrphan = await (
      await this.shopProductRepository.find(whereClause)
    ).sort(() => Math.random() - 0.5);
    console.log(shopProductsOrphan.length);

    for (const shopProduct of shopProductsOrphan) {
      if (!shopProduct) continue;

      const reducedSitemap = this.shopService.reduceSitemap(
        shopProduct.shop.sitemapEntity.sitemapUrl.urls,
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
        expectedPrice: shopProduct.product.price,
        links: [],
        sitemapEntity: {
          ...shopProduct.shop.sitemapEntity,
          sitemapUrls: limitedUrls,
          shopId: shopProduct.shop.id,
        },
        hash: shopProduct.candidatePages[0]?.candidatePageCache?.hash ?? '0',
        confirmed:
          shopProduct.candidatePages[0]?.candidatePageCache?.confirmed ?? false,
        count: shopProduct.candidatePages[0]?.candidatePageCache?.count ?? 0,
        candidatePages: shopProduct.candidatePages,
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

    const shopProductsOrphan = await (
      await this.shopProductRepository.find(whereClause)
    ).sort(() => Math.random() - 0.5);
    console.log(shopProductsOrphan.length);

    for (const shopProduct of shopProductsOrphan) {
      if (!shopProduct) continue;

      const reducedSitemap = this.shopService.reduceSitemap(
        shopProduct.shop.sitemapEntity.sitemapUrl.urls,
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
        expectedPrice: shopProduct.product.price,
        links: [],
        sitemapEntity: {
          ...shopProduct.shop.sitemapEntity,
          sitemapUrls: limitedUrls,
          shopId: shopProduct.shop.id,
        },
        hash: shopProduct.candidatePages[0]?.candidatePageCache?.hash ?? '0',
        confirmed:
          shopProduct.candidatePages[0]?.candidatePageCache?.confirmed ?? false,
        count: shopProduct.candidatePages[0]?.candidatePageCache?.count ?? 0,
        candidatePages: shopProduct.candidatePages,
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

    const shopProductsOrphan = await (
      await this.shopProductRepository.find(whereClause)
    ).sort(() => Math.random() - 0.5);
    console.log(shopProductsOrphan.length);

    for (const shopProduct of shopProductsOrphan) {
      if (!shopProduct) continue;

      const reducedSitemap = this.shopService.reduceSitemap(
        shopProduct.shop.sitemapEntity.sitemapUrl.urls,
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
        expectedPrice: shopProduct.product.price,
        links: [],
        sitemapEntity: {
          ...shopProduct.shop.sitemapEntity,
          sitemapUrls: limitedUrls,
          shopId: shopProduct.shop.id,
        },
        hash: shopProduct.candidatePages[0]?.candidatePageCache?.hash ?? '0',
        confirmed:
          shopProduct.candidatePages[0]?.candidatePageCache?.confirmed ?? false,
        count: shopProduct.candidatePages[0]?.candidatePageCache?.count ?? 0,
        candidatePages: shopProduct.candidatePages,
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

  @Cron('0 1,3,5,7,9,11,13,15,17,19,21,23 * * *', { timeZone: 'Europe/London' })
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
          shopProductBlacklistUrls: {
            blackListUrl: true,
          },
          candidatePages: {
            candidatePageCache: true,
          },
        },
      })
    ).sort(() => Math.random() - 0.5);
    console.log(shopProductsOrphan.length);

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
        links: limitedUrls,
        expectedPrice: shopProduct.product.price,
        sitemapEntity: {
          ...shopProduct.shop.sitemapEntity,
          sitemapUrls: [],
          shopId: shopProduct.shop.id,
        },
        hash: shopProduct.candidatePages[0]?.candidatePageCache?.hash ?? '0',
        confirmed:
          shopProduct.candidatePages[0]?.candidatePageCache?.confirmed ?? false,
        count: shopProduct.candidatePages[0]?.candidatePageCache?.count ?? 0,
        candidatePages: shopProduct.candidatePages,
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
      // await new Promise((r) => setTimeout(r, 1));
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
    console.log(shopProductsOrphan.length);

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

        const limitedUrls = await this.filteredLimitedUrls(
          shopProduct,
          shopProduct.links,
        );

        if (limitedUrls.length === 0) {
          console.log(
            `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
          );
          continue;
        }

        // if (shopProduct.links.length === 0) {
        //   console.log(
        //     `no_links_found ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        //   );
        //   continue;
        // }

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
          expectedPrice: shopProduct.product.price,
          links: limitedUrls,
          sitemapEntity: {
            ...shopProduct.shop.sitemapEntity,
            sitemapUrls: [],
            shopId: shopProduct.shop.id,
          },
          hash: shopProduct.candidatePages[0]?.candidatePageCache?.hash ?? '0',
          confirmed:
            shopProduct.candidatePages[0]?.candidatePageCache?.confirmed ??
            false,
          count: shopProduct.candidatePages[0]?.candidatePageCache?.count ?? 0,
          candidatePages: shopProduct.candidatePages,
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

      index += increment;

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
    let blackListUrls: string[] = [];

    if (shopProduct.shopProductBlacklistUrls) {
      blackListUrls = shopProduct.shopProductBlacklistUrls.map(
        (shopProductBlacklistUrl) => shopProductBlacklistUrl.blackListUrl.url,
      );
    }

    // console.log(blackListUrls);

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

    // console.log(momentOfTruth);

    // await new Promise((r) => setTimeout(r, 20000000));
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
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        product: true,
        candidatePages: {
          candidatePageCache: true,
        },
      },
    });

    console.log(shopProductsOrphan.length);

    for (const shopProduct of shopProductsOrphan) {
      // const reducedSitemap = this.shopService.reduceSitemap(
      //   shopProduct.shop.sitemapEntity.sitemapUrl.urls,
      //   shopProduct.product.name,
      // );

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        shopProduct.links,
      );

      if (limitedUrls.length === 0) {
        console.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      // if (shopProduct.links.length === 0) {
      //   console.log(
      //     `no_links_found ${shopProduct.shop.name} - ${shopProduct.product.name}`,
      //   );
      //   continue;
      // }

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
        links: limitedUrls,
        expectedPrice: shopProduct.product.price,
        sitemapEntity: {
          ...shopProduct.shop.sitemapEntity,
          sitemapUrls: [],
          shopId: shopProduct.shop.id,
        },
        hash: shopProduct.candidatePages[0]?.candidatePageCache?.hash ?? '0',
        confirmed:
          shopProduct.candidatePages[0]?.candidatePageCache?.confirmed ?? false,
        count: shopProduct.candidatePages[0]?.candidatePageCache?.count ?? 0,
        candidatePages: shopProduct.candidatePages,
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
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        product: true,
        candidatePages: {
          candidatePageCache: true,
        },
      },
    });

    console.log(shopProductsOrphan.length);

    for (const shopProduct of shopProductsOrphan) {
      // const reducedSitemap = this.shopService.reduceSitemap(
      //   shopProduct.shop.sitemapEntity.sitemapUrl.urls,
      //   shopProduct.product.name,
      // );

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        shopProduct.links,
      );

      if (limitedUrls.length === 0) {
        console.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      // if (shopProduct.links.length === 0) {
      //   console.log(
      //     `no_links_found ${shopProduct.shop.name} - ${shopProduct.product.name}`,
      //   );
      //   continue;
      // }

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
        links: limitedUrls,
        expectedPrice: shopProduct.product.price,
        sitemapEntity: {
          ...shopProduct.shop.sitemapEntity,
          sitemapUrls: [],
          shopId: shopProduct.shop.id,
        },
        hash: shopProduct.candidatePages[0]?.candidatePageCache?.hash ?? '0',
        confirmed:
          shopProduct.candidatePages[0]?.candidatePageCache?.confirmed ?? false,
        count: shopProduct.candidatePages[0]?.candidatePageCache?.count ?? 0,
        candidatePages: shopProduct.candidatePages,
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

    const limitedUrls = await this.filteredLimitedUrls(
      shopProduct,
      shopProduct.links,
    );

    // console.log(limitedUrls);

    if (limitedUrls.length === 0) {
      console.log(
        `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
      );
      throw new NotFoundException('no_urls_found_for_product');
    }

    // if (shopProduct.links.length === 0)
    //   throw new NotFoundException('no_links_found');

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
      links: limitedUrls,
      expectedPrice: shopProduct.product.price,
      sitemapEntity: {
        ...shopProduct.shop.sitemapEntity,
        shopId: shopProduct.shop.id,
        sitemapUrls: [],
      },
      hash: shopProduct.candidatePages[0]?.candidatePageCache?.hash ?? '0',
      confirmed:
        shopProduct.candidatePages[0]?.candidatePageCache?.confirmed ?? false,
      count: shopProduct.candidatePages[0]?.candidatePageCache?.count ?? 0,
      candidatePages: shopProduct.candidatePages,
    };

    if (shopProduct.shop.isShopifySite === true) {
      this.headlessClient.emit<CreateProcessDto>(
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

    const limitedUrls = await this.filteredLimitedUrls(
      shopProduct,
      shopProduct.links,
    );

    if (limitedUrls.length === 0) {
      console.log(
        `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
      );
      throw new NotFoundException('no_urls_found_for_product');
    }

    // if (shopProduct.links.length === 0)
    //   throw new NotFoundException('no_links_found');

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
      links: limitedUrls,
      expectedPrice: shopProduct.product.price,
      sitemapEntity: {
        ...shopProduct.shop.sitemapEntity,
        shopId: shopProduct.shop.id,
        sitemapUrls: [],
      },
      hash: shopProduct.candidatePages[0]?.candidatePageCache?.hash ?? '0',
      confirmed:
        shopProduct.candidatePages[0]?.candidatePageCache?.confirmed ?? false,
      count: shopProduct.candidatePages[0]?.candidatePageCache?.count ?? 0,
      candidatePages: shopProduct.candidatePages,
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
        shopProductBlacklistUrls: {
          blackListUrl: true,
        },
        candidatePages: {
          candidatePageCache: true,
        },
      },
    });

    console.log(shopProducts.length);

    for (const shopProduct of shopProducts) {
      // const reducedSitemap = this.shopService.reduceSitemap(
      //   shopProduct.shop.sitemapEntity.sitemapUrl.urls,
      //   shopProduct.product.name,
      // );

      const limitedUrls = await this.filteredLimitedUrls(
        shopProduct,
        shopProduct.links,
      );

      if (limitedUrls.length === 0) {
        console.log(
          `No URLs found for ${shopProduct.shop.name} - ${shopProduct.product.name}`,
        );
        continue;
      }

      // if (shopProduct.links.length === 0) {
      //   console.log(
      //     `no_links_found ${shopProduct.shop.name} - ${shopProduct.product.name}`,
      //   );
      //   continue;
      // }

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
        links: limitedUrls,
        expectedPrice: shopProduct.product.price,
        sitemapEntity: {
          ...shopProduct.shop.sitemapEntity,
          shopId: shopProduct.shop.id,
          sitemapUrls: [],
        },
        hash: shopProduct.candidatePages[0]?.candidatePageCache?.hash ?? '0',
        confirmed:
          shopProduct.candidatePages[0]?.candidatePageCache?.confirmed ?? false,
        count: shopProduct.candidatePages[0]?.candidatePageCache?.count ?? 0,
        candidatePages: shopProduct.candidatePages,
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
    console.log(webpageUrl);
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

    console.log(shopProductEntity);

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
    console.log(updateShopProductDto);
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
    console.log('updateLinks called');
    await this.checkForIndividualShopProduct(id);
    return updateResult;
  }

  async remove(id: string): Promise<ShopProduct> {
    const shopProductEntity = await this.findOne(id);
    return this.shopProductRepository.remove(shopProductEntity);
  }
}
