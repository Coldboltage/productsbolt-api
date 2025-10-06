import { ConflictException, Injectable } from '@nestjs/common';
import { CreateSitemapDto } from './dto/create-sitemap.dto';
import { UpdateSitemapDto } from './dto/update-sitemap.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Sitemap } from './entities/sitemap.entity';
import { Repository, UpdateResult } from 'typeorm';
import { ShopService } from '../shop/shop.service';
import { ShopProductService } from 'src/shop-product/shop-product.service';

@Injectable()
export class SitemapService {
  constructor(
    @InjectRepository(Sitemap) private sitemapRepository: Repository<Sitemap>,
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
    });
  }

  async generateSitemapAllShops(): Promise<void> {
    const shops = await this.shopService.findAllRegardless();
    for (const shop of shops) {
      console.log(shop);
      const sitemapEntity = await this.create({
        isShopifySite: shop.isShopifySite,
        shopId: shop.id,
        sitemapUrls: shop.sitemapEntity.sitemapUrls,
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

  async findOne(id: string): Promise<Sitemap> {
    return this.sitemapRepository.findOne({
      where: {
        id,
      },
      relations: {
        shop: true,
      },
    });
  }

  async checkSiteMap(
    id: string,
    updateSitemapDto: UpdateSitemapDto,
  ): Promise<void> {
    const sitemapEntity = await this.findOne(id);
    const sameSites = sitemapEntity.sitemapUrls.every((url) => {
      return updateSitemapDto.sitemapUrls.includes(url);
    });
    console.log(sameSites);
    if (!sameSites) {
      await this.update(id, updateSitemapDto);
      console.log('updating shopProduct links');
    } else {
      console.log('no need to update shopProduct links');
    }
  }

  async update(
    id: string,
    updateSitemapDto: UpdateSitemapDto,
  ): Promise<UpdateResult> {
    const result = await this.sitemapRepository.update(id, updateSitemapDto);
    console.log('updating shopProduct links');
    const sitemapEntity = await this.findOne(id);
    const shopEntity = sitemapEntity.shop;
    await this.shopProductService.manualUpdateAllShopProductsForShopImmediateLinks(
      shopEntity.id,
      false,
    );
    return result;
  }

  async remove(id: string): Promise<Sitemap> {
    const sitemapEntity = await this.findOne(id);
    return this.sitemapRepository.remove(sitemapEntity);
  }
}
