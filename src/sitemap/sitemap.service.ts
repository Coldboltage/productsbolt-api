import { ConflictException, Injectable } from '@nestjs/common';
import { CreateSitemapDto } from './dto/create-sitemap.dto';
import { UpdateSitemapDto } from './dto/update-sitemap.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Sitemap } from './entities/sitemap.entity';
import { Repository } from 'typeorm';
import { ShopService } from '../shop/shop.service';

@Injectable()
export class SitemapService {
  constructor(
    @InjectRepository(Sitemap) private sitemapRepository: Repository<Sitemap>,
    private shopService: ShopService,
  ) { }
  async create(createSitemapDto: CreateSitemapDto) {
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

  async generateSitemapAllShops() {
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

  async resetAllFastMode() {
    const sitemaps = await this.findAll();
    sitemaps.forEach((sitemap) => (sitemap.fast = false));
    return this.sitemapRepository.save(sitemaps);
  }

  async findAll() {
    return this.sitemapRepository.find({
      relations: {
        shop: true,
      },
    });
  }

  async findOne(id: string) {
    return this.sitemapRepository.findOne({
      where: {
        id,
      },
      relations: {
        shop: true,
      },
    });
  }

  async update(id: string, updateSitemapDto: UpdateSitemapDto) {
    console.log(id);
    const result = await this.sitemapRepository.update(id, updateSitemapDto);
    console.log(result);
    return result;
  }

  remove(id: string) {
    return `This action removes a #${id} sitemap`;
  }
}
