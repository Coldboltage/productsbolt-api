import {
  ConflictException,
  Inject,
  Injectable,
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

  async create(createShopDto: CreateShopDto): Promise<Shop> {
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
    if (shop.isShopifySite) {
      this.headlessClient.emit('shopifyCollectionsTest', shop);
    }
  }

  async testShopifySiteCollectionAllShopify(): Promise<void> {
    const shops = await this.findAll();
    const shopifyShops = shops.filter((shop) => shop.isShopifySite === true);
    for (const shop of shopifyShops) {
      this.slowSitemapClient.emit('shopifyCollectionsTest', shop);
    }
  }

  async updateSpecificShopSitemap(shopId: string): Promise<void> {
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

  async manuallyUpdateSitemap(shopId: string): Promise<void> {
    const shop = await this.findOne(shopId);
    this.headfulClient.emit('manualSitemapSearch', shop);
  }

  async checkShopsIfShopify(): Promise<void> {
    const shopEntities = await this.findAll();
    for (const shop of shopEntities) {
      // Check if main site and it's content is shopify
      // / true or false
      this.headfulClient.emit('shopyifyCheck', shop);
    }
  };

  async checkIfShopIsShopify(shopId: string): Promise<void> {
    const shop = await this.findOne(shopId);
    if (shop) this.headfulClient.emit('shopyifyCheck', shop);
  }


  async findAll(): Promise<Shop[]> {
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

  async findAllRegardless(): Promise<Shop[]> {
    return this.shopsRepository.find({
      where: {},
      relations: {
        shopProducts: true,
      },
    });
  }

  async findOne(id: string): Promise<Shop>{
    return this.shopsRepository.findOne({
      where: {
        id,
      },
      relations: {
        sitemapEntity: true,
      },
    });
  }

  async update(id: string, updateShopDto: UpdateShopDto): Promise<UpdateResult> {
    const updatedEntity = await this.shopsRepository.update(
      { id },
      updateShopDto,
    );
    console.log(id);
    console.log(updatedEntity);
    return updatedEntity;
  }

  async remove(id: string): Promise<Shop> {
    const shopEntity = await this.findOne(id);
    return this.shopsRepository.remove(shopEntity)
  }

  reduceSitemap(urls: string[], query: string): string[] {
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
