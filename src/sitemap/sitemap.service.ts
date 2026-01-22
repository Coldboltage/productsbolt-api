import { ConflictException, Injectable } from '@nestjs/common';
import { CreateSitemapDto } from './dto/create-sitemap.dto';
import { UpdateSitemapDto } from './dto/update-sitemap.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Sitemap } from './entities/sitemap.entity';
import { Repository, UpdateResult } from 'typeorm';
import { ShopService } from '../shop/shop.service';
import { ShopProductService } from 'src/shop-product/shop-product.service';
import { SitemapUrl } from 'src/sitemap-url/entities/sitemap-url.entity';

@Injectable()
export class SitemapService {
  constructor(
    @InjectRepository(Sitemap) private sitemapRepository: Repository<Sitemap>,
    @InjectRepository(SitemapUrl)
    private sitemapUrlRepository: Repository<SitemapUrl>,

    private shopService: ShopService,
    private shopProductService: ShopProductService,
  ) {}
  async create(createSitemapDto: CreateSitemapDto): Promise<Sitemap> {
    const sitemapExist = await this.sitemapRepository.exists({
      where: {
        shop: {
          id: createSitemapDto.shopId,
        },
      },
      relations: {
        shop: true,
      },
    });
    if (sitemapExist) {
      throw new ConflictException('sitemap_already_exists_for_shop');
    }
    const shopEntity = await this.shopService.findOne(createSitemapDto.shopId);
    console.log(sitemapExist);
    return this.sitemapRepository.save({
      ...createSitemapDto,
      shop: shopEntity,
      sitemapUrl: { urls: [''] },
    });
  }

  async generateSitemapAllShops(): Promise<void> {
    const shops = await this.shopService.findAllRegardless();
    for (const shop of shops) {
      console.log(shop);
      const sitemapEntity = await this.create({
        isShopifySite: shop.isShopifySite,
        shopId: shop.id,
        sitemapUrls: [''],
        sitemap: shop.sitemap,
      });
      console.log(sitemapEntity);
    }
  }

  async resetAllFastMode(): Promise<void> {
    const sitemaps = await this.findAll();
    sitemaps.forEach((sitemap) => (sitemap.fast = false));
    await this.sitemapRepository.save(sitemaps);
  }

  async findAll(): Promise<Sitemap[]> {
    return this.sitemapRepository.find({
      relations: {
        shop: true,
      },
    });
  }

  async findAllWithSitemapUrl(): Promise<Sitemap[]> {
    return this.sitemapRepository.find({
      relations: {
        shop: true,
        sitemapUrl: true,
      },
    });
  }

  async findOne(id: string): Promise<Sitemap> {
    return this.sitemapRepository.findOne({
      where: {
        id,
      },
      relations: {
        shop: true,
        sitemapUrl: true,
      },
    });
  }

  async checkSiteMapLoop(
    sitemapEntity: Sitemap,
    updateSitemapDto: UpdateSitemapDto,
  ): Promise<boolean> {
    if (
      sitemapEntity.sitemapUrl.urls.length !==
      updateSitemapDto.sitemapUrls.length
    )
      return false;
    console.time('checkSites');

    const dbUrls = new Set(sitemapEntity.sitemapUrl.urls);

    for (let i = 0; i < updateSitemapDto.sitemapUrls.length; i++) {
      const url = updateSitemapDto.sitemapUrls[i];

      if (!dbUrls.has(url)) {
        console.timeEnd('checkSites');
        return false;
      }

      if ((i + 1) % 10_000 === 0) {
        console.log(`⏸ Yielding at ${i + 1} URLs processed...`);
        await new Promise((r) => setImmediate(r));
      }
    }

    console.log('✅ Done checking, result is: ', true);
    console.timeEnd('checkSites');
    return true;
  }

  async checkSiteMap(
    id: string,
    updateSitemapDto: UpdateSitemapDto,
  ): Promise<void> {
    const sitemapEntity = await this.findOne(id);
    console.log('checking sitemap urls');
    console.time('checkSites');
    let sameSites = true;

    sameSites = await this.checkSiteMapLoop(sitemapEntity, updateSitemapDto);
    console.log(sameSites);

    if (!sameSites) {
      console.log(sitemapEntity.sitemapUrl.id);
      await this.sitemapUrlRepository.update(sitemapEntity.sitemapUrl.id, {
        urls: updateSitemapDto.sitemapUrls || [''],
      });
      await this.update(id, {
        ...updateSitemapDto,
      });

      console.log('updating shopProduct links');
    } else {
      console.log('no need to update shopProduct links');
    }
  }

  async shopifyOrNot(
    id: string,
    updateSitemapDto: UpdateSitemapDto,
  ): Promise<UpdateResult> {
    const result = await this.sitemapRepository.update(id, updateSitemapDto);
    console.log('updating shopProduct links');
    const sitemapEntity = await this.findOne(id);
    const shopEntity = sitemapEntity.shop;
    console.log(`isShopifySite: ${updateSitemapDto.isShopifySite}`);
    if (updateSitemapDto.isShopifySite === false) {
      await this.shopService.singleCloudflareTest(shopEntity.id);
    } else {
      await this.shopService.testShopifySiteCollection(shopEntity.id);
    }

    return result;
  }

  async update(
    id: string,
    updateSitemapDto: UpdateSitemapDto,
  ): Promise<UpdateResult> {
    const { sitemapUrls, ...rest } = updateSitemapDto;
    await this.sitemapRepository.update(id, rest);
    const result = await this.sitemapRepository.update(id, rest);
    console.log('updating shopProduct links');
    const sitemapEntity = await this.findOne(id);
    const shopEntity = sitemapEntity.shop;
    await this.shopProductService.manualUpdateAllShopProductsForShopImmediateLinks(
      shopEntity.id,
      false,
    );
    return result;
  }

  async updateFromShopifyCollectionsTest(
    id: string,
    updateSitemapDto: UpdateSitemapDto,
  ): Promise<UpdateResult> {
    const result = await this.sitemapRepository.update(id, updateSitemapDto);
    // console.log('updating shopProduct links');
    // const sitemapEntity = await this.findOne(id);
    // const shopEntity = sitemapEntity.shop;
    // await this.shopProductService.manualUpdateAllShopProductsForShopImmediateLinks(
    //   shopEntity.id,
    //   false,
    // );
    return result;
  }

  async remove(id: string): Promise<Sitemap> {
    const sitemapEntity = await this.findOne(id);
    return this.sitemapRepository.remove(sitemapEntity);
  }
}
