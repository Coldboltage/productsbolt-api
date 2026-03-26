import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { CreateSitemapDto } from './dto/create-sitemap.dto';
import { UpdateSitemapDto } from './dto/update-sitemap.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Sitemap } from './entities/sitemap.entity';
import { DeepPartial, In, Repository, UpdateResult } from 'typeorm';
import { ShopService } from '../shop/shop.service';
import { ShopProductService } from 'src/shop-product/shop-product.service';
import { SitemapUrl } from 'src/sitemap-url/entities/sitemap-url.entity';
import { Url } from 'src/url/url.entity';

@Injectable()
export class SitemapService {
  private logger = new Logger(SitemapService.name);
  constructor(
    @InjectRepository(Sitemap) private sitemapRepository: Repository<Sitemap>,
    @InjectRepository(SitemapUrl)
    private sitemapUrlRepository: Repository<SitemapUrl>,
    @InjectRepository(Url)
    private urlRepository: Repository<Url>,

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
      sitemapUrl: {},
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
        sitemapUrl: {
          urls: true,
        },
      },
    });
  }

  async findOneShopId(id: string): Promise<Sitemap> {
    return this.sitemapRepository.findOne({
      where: {
        id,
      },
      relations: {
        shop: true,
      },
    });
  }

  async findOneForCheck(id: string): Promise<Sitemap> {
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
    dbUrls: string[],
    updateSitemapDto: UpdateSitemapDto,
  ): Promise<{ unchanged: boolean; newUrls: string[]; deleteUrls: string[] }> {
    const crawledUrls = new Set(updateSitemapDto.sitemapUrls ?? []);
    const deleteUrls: string[] = [];

    for (const url of dbUrls) {
      if (crawledUrls.has(url)) {
        crawledUrls.delete(url);
      } else {
        deleteUrls.push(url);
      }
    }

    const newUrls = Array.from(crawledUrls);
    const unchanged = newUrls.length === 0 && deleteUrls.length === 0;
    crawledUrls.clear();

    return { unchanged, newUrls, deleteUrls };
  }

  async checkSiteMap(
    id: string,
    updateSitemapDto: UpdateSitemapDto,
  ): Promise<void> {
    this.logger.debug(['before findOneForCheck', process.memoryUsage()]);

    const sitemapEntity = await this.findOneForCheck(id);
    const dbUrls = (
      await this.urlRepository.find({
        where: {
          sitemapUrl: { id: sitemapEntity.sitemapUrl.id },
        },
        select: {
          url: true,
        },
      })
    ).map(({ url }) => url);

    this.logger.debug(['after find', process.memoryUsage()]);

    console.log('checking sitemap urls');
    console.time('checkSites');

    this.logger.debug(['before checkSiteMapLoop', process.memoryUsage()]);

    const sameSites = await this.checkSiteMapLoop(dbUrls, updateSitemapDto);
    console.log({
      unchanged: sameSites.unchanged,
      newUrls: sameSites.newUrls.length,
      deleteUrls: sameSites.deleteUrls.length,
    });

    this.logger.debug(['after checkSiteMapLoop', process.memoryUsage()]);

    // await new Promise((r) => setTimeout(r, 200000000));

    if (!sameSites.unchanged) {
      console.log(sitemapEntity.sitemapUrl.id);
      await this.sitemapUrlRepository.update(sitemapEntity.sitemapUrl.id, {
        // urls: updateSitemapDto.sitemapUrls || [''],
        freshUrls: sameSites.newUrls,
      });
      this.logger.debug(`deleting urls for shopId: ${updateSitemapDto.shopId}`);
      await this.urlRepository.delete({
        sitemapUrl: { id: sitemapEntity.sitemapUrl.id },
        url: In(sameSites.deleteUrls),
      });
      this.logger.debug(`creating urls for shopId: ${updateSitemapDto.shopId}`);

      const chunkSize = 10000;

      this.logger.debug(['before chunking', process.memoryUsage()]);

      // await new Promise((r) => setTimeout(r, 200000000));

      const uniqueUrls = Array.from(new Set(sameSites.newUrls));

      const urlsToCreate = uniqueUrls.map((url) => ({
        url,
        sitemapUrl: { id: sitemapEntity.sitemapUrl.id },
      }));
      for (let i = 0; i < urlsToCreate.length; i += chunkSize) {
        const chunk = urlsToCreate.slice(i, i + chunkSize);

        await this.urlRepository
          .createQueryBuilder()
          .insert()
          .into(Url)
          .values(chunk)
          .orIgnore()
          .execute();
      }

      this.logger.debug(['after urlRepository', process.memoryUsage()]);

      // await new Promise((r) => setTimeout(r, 200000000));

      // await this.urlRepository.insert(urlsToCreate);
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
    const result = await this.sitemapRepository.update(id, rest);
    console.log('updating shopProduct links');
    const sitemapEntity = await this.findOneShopId(id);
    // const shopEntity = sitemapEntity.shop;
    // this.logger.debug(
    //   'manualUpdateAllShopProductsForShopImmediateLinks blocked',
    // );
    await this.shopProductService.manualUpdateAllShopProductsForShopImmediateLinks(
      sitemapEntity.shop.id,
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
