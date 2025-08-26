import {
  ConflictException,
  Inject,
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from './entities/shop.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { Sitemap } from '../sitemap/entities/sitemap.entity';

@Injectable()
export class ShopService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Shop) private shopsRepository: Repository<Shop>,
    @Inject('HEADFUL_CLIENT') private headfulClient: ClientProxy,
    @Inject('HEADLESS_CLIENT') private readonly headlessClient: ClientProxy,
    @Inject('SITEMAP_CLIENT') private readonly sitemapClient: ClientProxy,
    @Inject('SLOW_SITEMAP_CLIENT')
    private readonly slowSitemapClient: ClientProxy,
    private eventEmitter: EventEmitter2,
    private readonly scheduler: SchedulerRegistry,
  ) { }
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
      console.log('✅ Client connected to', url);
    });
    manager.on('disconnect', (params) => {
      console.log('❌ Client disconnected', params.err.message);
    });

    // Inspect the asserted queue options
    console.log('Client queueOptions:', client.options.queueOptions);
  }

  async create(createShopDto: CreateShopDto) {
    try {
      const entity = await this.shopsRepository.save({
        ...createShopDto,
        sitemapEntity: {
          sitemap: createShopDto.sitemap,
          manual: createShopDto.manual,
        } as Partial<Sitemap>,
      });
      this.eventEmitter.emit('shop.created', entity);
      this.headfulClient.emit('shopyifyCheck', entity);
      return entity;
    } catch (error) {
      throw new ConflictException('shop_already_created');
    }
  }

  async findShop(name: string) {
    return await this.shopsRepository.findOne({
      where: {
        name,
      },
      // relations: {
      //   webPages: true,
      // },
    });
  }

  @Cron(CronExpression.EVERY_12_HOURS, {
    name: 'updateSitemap',
  })
  async updateSitemap() {
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

  async fastSitemapAll() {
    const allActiveShops = await this.findAll();
    for (const shop of allActiveShops) {
      shop.sitemapEntity.fast = true;
      this.sitemapClient.emit('sitemapSearch', shop);
    }
  }

  async testShopifySiteCollection(shopId: string) {
    const shop = await this.findOne(shopId);
    if (shop.isShopifySite) {
      this.headlessClient.emit('shopifyCollectionsTest', shop);
    }
  }

  async testShopifySiteCollectionAllShopify() {
    const shops = await this.findAll();
    const shopifyShops = shops.filter((shop) => shop.isShopifySite === true);
    for (const shop of shopifyShops) {
      this.slowSitemapClient.emit('shopifyCollectionsTest', shop);
    }
  }

  async updateSpecificShopSitemap(shopId: string) {
    const shop = await this.findOne(shopId);
    console.log(shop.sitemapEntity);
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

  async manuallyUpdateSitemap(shopId: string) {
    const shop = await this.findOne(shopId);
    this.headfulClient.emit('manualSitemapSearch', shop);
  }

  checkShopsIfShopify = async () => {
    const shopEntities = await this.findAll();
    for (const shop of shopEntities) {
      // Check if main site and it's content is shopify
      // / true or false
      this.headfulClient.emit('shopyifyCheck', shop);
    }
  };

  async checkIfShopIsShopify(shopId: string) {
    const shop = await this.findOne(shopId);
    if (shop) this.headfulClient.emit('shopyifyCheck', shop);
  }

  // @OnEvent('shop-product.created')
  // async findShopsToUpdateProducts(shopProduct: ShopProduct) {
  //   console.log(`Adding new product: ${shopProduct.product.name}`);
  //   const createProcess: CreateProcessDto = {
  //     sitemap: shopProduct.shop.sitemap,
  //     url: shopProduct.shop.website,
  //     category: shopProduct.shop.category,
  //     name: shopProduct.product.name,
  //     shopProductId: shopProduct.id,
  //     shopWebsite: shopProduct.shop.name,
  //     type: shopProduct.product.type,
  //     context: shopProduct.product.context,
  //     crawlAmount: 90,
  //     sitemapUrls: shopProduct.shop.sitemapUrls,
  //     productId: shopProduct.product.id,
  //     shopId: shopProduct.shop.id,
  //     shopifySite: shopProduct.shop.isShopifySite,
  //     shopType: shopProduct.shop.uniqueShopType,
  //   };

  //   this.headfulClient.emit<CreateProcessDto>(
  //     'webpageDiscovery',
  //     createProcess,
  //   );
  // }

  async findAll() {
    return this.shopsRepository.find({
      where: {
        active: true,
      },
      relations: {
        shopProducts: true,
        sitemapEntity: true,
      },
    });
  }

  async findAllRegardless() {
    return this.shopsRepository.find({
      where: {},
      relations: {
        shopProducts: true,
      },
    });
  }

  async findOne(id: string) {
    return this.shopsRepository.findOne({
      where: {
        id,
      },
      relations: {
        sitemapEntity: true,
      },
    });
  }

  async update(id: string, updateShopDto: UpdateShopDto) {
    const updatedEntity = await this.shopsRepository.update(
      { id },
      updateShopDto,
    );
    console.log(id);
    console.log(updatedEntity);
    return updatedEntity;
  }

  remove(id: number) {
    return `This action removes a #${id} shop`;
  }

  reduceSitemap(urls: string[], query: string) {
    const extractKeywords = (rawUrl: string) => {
      const noQuery = rawUrl.split('?')[0].replace(/\/+$/, '');
      const name = decodeURIComponent(noQuery.split('/').pop() || '');

      const cleaned = name
        .toLowerCase()
        .normalize('NFKD') // normalize accents
        .replace(/[\u0300-\u036f]/g, '') // strip accent marks
        .replace(/[’'`]/g, '') // drop apostrophes (smart + straight)
        .replace(/[^a-z0-9]+/g, ' ') // everything non-alnum -> space
        .trim();

      return cleaned.split(/\s+/); // ['magic','the','gathering','assassins','creed','collector','booster','box']
    };

    const requiredMatches = (n: number) => Math.max(1, Math.floor((3 / 5) * n));

    const countMatches = (productKeys: string[], queryKeys: string[]) =>
      queryKeys.filter((k) => productKeys.includes(k)).length;

    const filterProducts = (urls: string[], query: string): string[] => {
      const products = urls.map((url) => ({
        url,
        keywords: extractKeywords(url),
      }));
      const queryKeys = query.toLowerCase().split(' ').filter(Boolean);
      const minMatches = requiredMatches(queryKeys.length);
      return products
        .filter((p) => countMatches(p.keywords, queryKeys) >= minMatches)
        .map((p) => p.url);
    };
    const result = filterProducts(urls, query);
    return result;
  }
}
