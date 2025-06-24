import { Inject, Injectable } from '@nestjs/common';
import { CreateShopProductDto } from './dto/create-shop-product.dto';
import { UpdateShopProductDto } from './dto/update-shop-product.dto';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ShopProduct } from './entities/shop-product.entity';
import { Repository } from 'typeorm';
import { ShopService } from '../shop/shop.service';
import { Product } from '../product/entities/product.entity';
import { ClientProxy } from '@nestjs/microservices';
import { ProductService } from '../product/product.service';
import { CreateProcessDto } from '../shop/dto/create-process.dto';
import { Shop } from '../shop/entities/shop.entity';

@Injectable()
export class ShopProductService {
  constructor(
    @Inject('PROCESS_CLIENT') private processClient: ClientProxy,
    @InjectRepository(ShopProduct)
    private shopProductRepository: Repository<ShopProduct>,
    private shopService: ShopService,
    private productService: ProductService,
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

  @OnEvent('product.created')
  async findShopsToUpdateProducts(product: Product) {
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
    const response = await Promise.all(shopProductsPromises);
    console.log(response);
  }

  @OnEvent('shop.created')
  async newShopCreated(shop: Shop) {
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
    console.log(response);
    return response;
  }

  async manualUpdateAllShopProducts() {
    const shopProductsOrphan = await this.shopProductRepository.find({
      where: {
        populated: false,
        shop: {
          active: true,
        },
      },
      relations: {
        shop: true,
        product: true,
      },
    });
    console.log(shopProductsOrphan.length);

    for (const shopProduct of shopProductsOrphan) {
      const createProcess: CreateProcessDto = {
        sitemap: shopProduct.shop.sitemap,
        url: shopProduct.shop.website,
        category: shopProduct.shop.category,
        name: shopProduct.product.name,
        shopWebsite: shopProduct.shop.name,
        type: shopProduct.product.type,
        context: shopProduct.product.context,
        crawlAmount: 30,
        sitemapUrls: shopProduct.shop.sitemapUrls,
        productId: shopProduct.productId,
        shopId: shopProduct.shopId,
      };
      this.processClient.emit<CreateProcessDto>(
        'webpageDiscovery',
        createProcess,
      );
    }
  }

  async manualFindShopsToUpdateProducts(productId: string) {
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
        shop: true,
        product: true,
      },
    });

    console.log(shopProductsOrphan.length);

    for (const shopProduct of shopProductsOrphan) {
      const createProcess: CreateProcessDto = {
        sitemap: shopProduct.shop.sitemap,
        url: shopProduct.shop.website,
        category: shopProduct.shop.category,
        name: product.name,
        shopWebsite: shopProduct.shop.name,
        type: product.type,
        context: product.context,
        crawlAmount: 30,
        sitemapUrls: shopProduct.shop.sitemapUrls,
        productId: shopProduct.productId,
        shopId: shopProduct.shopId,
      };
      this.processClient.emit<CreateProcessDto>(
        'webpageDiscovery',
        createProcess,
      );
    }
  }

  create(createShopProductDto: CreateShopProductDto) {
    return 'This action adds a new shopProduct';
  }

  findAll() {
    return `This action returns all shopProduct`;
  }

  findOne(id: string) {
    return this.shopProductRepository.findOne({ where: { id } });
  }

  async isUrlBlacklistedForShopProduct(url: string, shopProductId: string) {
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

  async findOneByShopProductName(name: string) {
    console.log(name);
    return this.shopProductRepository.findOne({
      where: {
        shop: {
          name,
        },
      },
    });
  }

  async findOneByProductId(productId: string, shopId: string) {
    return this.shopProductRepository.findOne({
      where: {
        productId,
        shopId,
      },
    });
  }
  // async findOneByShopName(name: string): Promise<ShopProduct> {
  //   console.log(name);
  //   return this.shopProductRepository.findOne({
  //     where: {
  //       shop: {
  //         name,
  //       },
  //     },
  //     relations: {
  //       shop: true,
  //     },
  //   });
  // }

  update(id: string, updateShopProductDto: UpdateShopProductDto) {
    return this.shopProductRepository.update({ id }, updateShopProductDto);
  }

  remove(id: number) {
    return `This action removes a #${id} shopProduct`;
  }
}
