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
import { Shop, UniqueShopType } from './entities/shop.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Product } from '../product/entities/product.entity';
import { ClientProxy } from '@nestjs/microservices';
import { CreateProcessDto } from './dto/create-process.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ShopProduct } from 'src/shop-product/entities/shop-product.entity';

@Injectable()
export class ShopService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Shop) private shopsRepository: Repository<Shop>,
    @Inject('PROCESS_CLIENT') private processClient: ClientProxy,

    @Inject('MISC_CLIENT')
    private readonly miscClient: ClientProxy,
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
  async create(createShopDto: CreateShopDto) {
    try {
      const entity = await this.shopsRepository.save(createShopDto);
      this.eventEmitter.emit('shop.created', entity);
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

  // @Cron(CronExpression.EVERY_30_MINUTES)
  async updateSitemap() {
    const allActiveShops = await this.findAll();
    // Start a background task and don’t await it

    for (const shop of allActiveShops) {
      this.miscClient.emit('sitemapSearch', shop);
      // const delay = 2000 + Math.random() * 500;
      // await new Promise((res) => setTimeout(res, delay));
    }

  }

  checkShopsIfShopify = async () => {
    const shopEntities = await this.findAll();
    for (const shop of shopEntities) {
      // Check if main site and it's content is shopify
      // / true or false
      this.miscClient.emit('shopyifyCheck', shop);
    }
  };

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

  //   this.processClient.emit<CreateProcessDto>(
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
      },
    });
  }

  findOne(website: string) {
    return this.shopsRepository.findOne({
      where: {
        website,
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
}
