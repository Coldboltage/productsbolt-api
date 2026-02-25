import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Shop } from './entities/shop.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { Sitemap } from '../sitemap/entities/sitemap.entity';
import { ProductListingsCheckInterface } from './dto/product-listings-check.dto';
import { Span } from 'nestjs-otel/lib/tracing/decorators/span';
import { ShopifyMetaDto } from './dto/shopify-meta.dto';

@Injectable()
export class ShopService implements OnApplicationBootstrap {
  private logger = new Logger(ShopService.name);
  constructor(
    @InjectRepository(Shop) private shopsRepository: Repository<Shop>,
    @Inject('HEADFUL_CLIENT') private headfulClient: ClientProxy,
    @Inject('HEADLESS_CLIENT') private readonly headlessClient: ClientProxy,
    @Inject('SITEMAP_CLIENT') private readonly sitemapClient: ClientProxy,
    @Inject('SLOW_SITEMAP_CLIENT')
    private readonly slowSitemapClient: ClientProxy,
    @Inject('HEADFUL_SLOW_CLIENT')
    private headfulSlowClient: ClientProxy,
    private eventEmitter: EventEmitter2,
    private readonly scheduler: SchedulerRegistry,
  ) {}
  async onApplicationBootstrap() {
    // Force the client to connect so we can inspect it
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
  }

  async create(createShopDto: CreateShopDto): Promise<Shop> {
    try {
      const entity = await this.shopsRepository.save({
        ...createShopDto,
        sitemapEntity: {
          sitemap: createShopDto.sitemap,
          manual: createShopDto.manual,
          sitemapUrl: {
            urls: [''],
          },
        } as Partial<Sitemap>,
      });
      await this.updateSpecificShopSitemap(entity.id);
      this.eventEmitter.emit('shop.created', entity);
      this.headfulClient.emit('shopifyCheck', entity);
      return entity;
    } catch (error) {
      throw new ConflictException('shop_already_created');
    }
  }

  async findShop(name: string): Promise<Shop> {
    return await this.shopsRepository.findOne({
      where: {
        name,
      },
    });
  }

  @Cron(CronExpression.EVERY_12_HOURS, {
    name: 'updateSitemap',
  })
  @Span('ShopService.updateSitemap')
  async updateSitemap(): Promise<void> {
    const allActiveShops = await this.findAll();
    // Start a background task and don’t await it

    for (const shop of allActiveShops) {
      if (
        shop.sitemapEntity.isShopifySite &&
        shop.sitemapEntity.error === false &&
        shop.sitemapEntity.manual === false &&
        shop.sitemapEntity.collections === true
      ) {
        this.headfulClient.emit('shopifySitemapSearch', shop);
      } else if (
        shop.sitemapEntity.fast === false &&
        shop.sitemapEntity.manual === false
      ) {
        this.slowSitemapClient.emit('sitemapSearch', shop);
      } else if (shop.sitemapEntity.manual === true) {
        this.headfulClient.emit('manualSitemapSearch', shop);
      } else {
        this.sitemapClient.emit('sitemapSearch', shop);
      }
    }
  }

  async fastSitemapAll(): Promise<void> {
    const allActiveShops = await this.findAll();
    for (const shop of allActiveShops) {
      shop.sitemapEntity.fast = true;
      this.sitemapClient.emit('sitemapSearch', shop);
    }
  }

  async testShopifySiteCollection(shopId: string): Promise<void> {
    const shop = await this.findOne(shopId);
    if (shop.sitemapEntity.isShopifySite) {
      this.logger.log('testShopifySiteCollection fired');
      this.headlessClient.emit('shopifyCollectionsTest', shop);
    }
  }

  async testShopifySiteCollectionAllShopify(): Promise<void> {
    const shops = await this.findAll();
    const shopifyShops = shops.filter(
      (shop) => shop.sitemapEntity.isShopifySite === true,
    );
    for (const shop of shopifyShops) {
      this.slowSitemapClient.emit('shopifyCollectionsTest', shop);
    }
  }

  async updateSpecificShopSitemap(shopId: string): Promise<void> {
    const shop = await this.findOneWithSitemapUrls(shopId);
    this.logger.log(shop.sitemapEntity);
    if (
      shop.sitemapEntity.isShopifySite &&
      shop.sitemapEntity.error === false &&
      shop.sitemapEntity.manual === false &&
      shop.sitemapEntity.collections === true
    ) {
      this.headfulClient.emit('shopifySitemapSearch', shop);
    } else if (
      shop.sitemapEntity.fast === false &&
      shop.sitemapEntity.manual === false
    ) {
      this.slowSitemapClient.emit('sitemapSearch', shop);
    } else if (shop.sitemapEntity.manual === true) {
      this.headfulClient.emit('manualSitemapSearch', shop);
    } else {
      this.sitemapClient.emit('sitemapSearch', shop);
    }
  }

  async manuallyUpdateSitemap(shopId: string): Promise<void> {
    const shop = await this.findOne(shopId);
    this.headfulClient.emit('manualSitemapSearch', shop);
  }

  async checkShopsIfShopify(): Promise<void> {
    const shopEntities = await this.findAll();
    for (const shop of shopEntities) {
      // Check if main site and it's content is shopify
      // / true or false
      this.headfulClient.emit('shopifyCheck', shop);
    }
  }

  async checkIfShopIsShopify(shopId: string): Promise<void> {
    this.logger.log('checkIfShopIsShopify called with id:', shopId);
    const shop = await this.findOne(shopId);
    this.logger.log(shop.name);
    if (shop) this.headfulClient.emit('shopifyCheck', shop);
  }

  @Span('ShopService.findAll')
  async findAll(): Promise<Shop[]> {
    return this.shopsRepository.find({
      where: {
        active: true,
      },
      relations: {
        shopProducts: {
          webPage: true,
        },
        sitemapEntity: true,
      },
      order: {
        sitemapEntity: {
          isShopifySite: 'ASC',
        },
      },
    });
  }

  async findAllRegardless(): Promise<Shop[]> {
    return this.shopsRepository.find({
      where: {},
      relations: {
        shopProducts: true,
      },
    });
  }

  async findShopsWithActiveShopProducts(): Promise<Shop[]> {
    return this.shopsRepository.find({
      where: {
        shopProducts: {
          populated: true,
        },
      },
      relations: {
        shopProducts: {
          webPage: true,
        },
        sitemapEntity: {
          sitemapUrl: true,
        },
      },
    });
  }

  async findOne(id: string): Promise<Shop> {
    return this.shopsRepository.findOne({
      where: {
        id,
      },
      relations: {
        sitemapEntity: true,
        shopProducts: {
          webPage: true,
        },
        shopListings: true,
      },
    });
  }

  async findOneWithSitemapUrls(id: string): Promise<Shop> {
    return this.shopsRepository.findOne({
      where: {
        id,
      },
      relations: {
        sitemapEntity: {
          sitemapUrl: true,
        },
        shopProducts: {
          webPage: true,
        },
        shopListings: true,
      },
    });
  }

  async findAllShopifyShops() {
    return this.shopsRepository.find({
      where: {
        sitemapEntity: {
          isShopifySite: true,
        },
        active: true,
        cloudflare: false,
      },
      relations: {
        sitemapEntity: true,
      },
    });
  }

  async getAllShopifyMetaInformation() {
    const shopifyShops = await this.findAllShopifyShops();
    const filterShops = shopifyShops.filter((shop) => shop.country == null);
    this.logger.log(filterShops.length);
    for (const shop of filterShops) {
      const shopifyMetPayload: ShopifyMetaDto = {
        url: shop.website,
        id: shop.id,
      };

      this.headfulSlowClient.emit('shopifyMeta', shopifyMetPayload);
    }
  }

  async getAllCurrencies() {
    const currencies = await this.shopsRepository.find({
      where: {
        active: true,
      },
      select: {
        currency: true,
      },
    });
    return Array.from(
      new Set(currencies.map((shop) => shop.currency).filter(Boolean)),
    );
  }

  async update(
    id: string,
    updateShopDto: UpdateShopDto,
  ): Promise<UpdateResult> {
    const updatedEntity = await this.shopsRepository.update(
      { id },
      updateShopDto,
    );
    this.logger.log(id);
    this.logger.log(updatedEntity);
    return updatedEntity;
  }

  async batchUpdate(updateShopDto: UpdateShopDto[]) {
    this.logger.log(updateShopDto);
    for (const shop of updateShopDto) {
      const { city, province, country, currency } = shop;
      this.logger.log({});
      await this.update(shop.id, { city, province, country, currency });
    }
  }

  async remove(id: string): Promise<Shop> {
    const shopEntity = await this.findOne(id);
    return this.shopsRepository.remove(shopEntity);
  }

  reduceSitemap(urls: string[], query: string): string[] {
    const extractKeywords = (rawUrl: string): string[] => {
      const noQuery = rawUrl.split(/[?#]/)[0].replace(/\/+$/, '');
      const parts = noQuery.split('/').filter(Boolean);

      // grab last non-ID segment (slug)
      let name = decodeURIComponent(parts.pop() || '');
      const looksLikeId = (s: string) =>
        /^[0-9]+$/.test(s) || // numeric
        /^[a-f0-9]{24}$/i.test(s) || // Mongo ObjectId
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          s,
        ) || // UUID
        (!s.includes('-') && /^[A-Za-z0-9_]{6,64}$/.test(s)); // opaque hash-like

      while (name && looksLikeId(name) && parts.length) {
        name = decodeURIComponent(parts.pop() || '');
      }

      if (!name) return [];

      const cleaned = name
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’'`]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

      return cleaned ? cleaned.split(/\s+/) : [];
    };

    const requiredMatches = (n: number) => Math.max(1, Math.floor(0.65 * n));

    const countMatches = (productKeys: string[], queryKeys: string[]) =>
      queryKeys.filter((k) => productKeys.includes(k)).length;

    const filterProducts = (urls: string[], query: string): string[] => {
      const products = urls.map((url) => ({
        url,
        keywords: extractKeywords(url),
      }));
      const queryKeys = extractKeywords(query);
      const minMatches = requiredMatches(queryKeys.length);
      return products
        .filter((p) => countMatches(p.keywords, queryKeys) >= minMatches)
        .map((p) => p.url);
    };
    const result = filterProducts(urls, query);

    return result;
  }

  async cloudflareTest() {
    const shopEntity = await this.findAll();
    for (const shop of shopEntity) {
      if (shop.sitemapEntity.isShopifySite === true) continue;

      this.headlessClient.emit('cloudflare-test', shop);
    }
  }

  async singleCloudflareTest(shopId: string) {
    const shopEntity = await this.findOne(shopId);
    if (shopEntity.sitemapEntity.isShopifySite === true) {
      throw new BadRequestException('shop_is_shopify');
    }

    this.headlessClient.emit('cloudflare-test', shopEntity);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkShopListingsCron() {
    this.logger.log('Running checkShopListingsCron job');
    const shopToCheck = await this.shopsRepository.find({
      where: {
        active: true,
        shopListingCheck: true,
      },
    });
    for (const shop of shopToCheck) {
      this.logger.log(`Checking shop listings for shop: ${shop.name}`);
      this.checkShopProductListings(shop.id);
    }
  }

  async checkShopProductListings(shopId: string): Promise<void> {
    const shopEntity = await this.findOne(shopId);

    const payload: ProductListingsCheckInterface = {
      urls: shopEntity.productListingUrls,
      existingUrls: shopEntity.shopListings.map(
        (listings) => listings.listingUrl,
      ),
      selectors: shopEntity.selectors,
      shopId: shopEntity.id,
      urlStructure: `${shopEntity.protocol}${shopEntity.website}`,
    };

    this.logger.log('Emitting product-listings-check with payload:', payload);
    this.headlessClient.emit('product-listings-check', payload);
  }
}
