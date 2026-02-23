import { Injectable, Logger } from '@nestjs/common';
import { CreateWebpageCacheDto } from './dto/create-webpage-cache.dto';
import { UpdateWebpageCacheDto } from './dto/update-webpage-cache.dto';
import { WebpageService } from '../webpage/webpage.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebpageCache } from './entities/webpage-cache.entity';
import { UpdateWebpageDto } from 'src/webpage/dto/update-webpage.dto';

@Injectable()
export class WebpageCacheService {
  private logger = new Logger(WebpageCacheService.name);
  constructor(
    @InjectRepository(WebpageCache)
    private webpageCacheRepository: Repository<WebpageCache>,
    private webpageService: WebpageService,
  ) {}

  create(createWebpageCacheDto: CreateWebpageCacheDto) {
    return 'This action adds a new webpageCache';
  }

  async createFromSpecificWebpage(webpageId: string) {
    const webpage = await this.webpageService.findOne(webpageId);
    return this.webpageCacheRepository.save({ webpage, date: new Date() });
  }

  async createAllFromWebpages() {
    const webpages = await this.webpageService.findAll();
    for (const webpage of webpages) {
      if (webpage.webpageCache && webpage.webpageCache.id) continue;
      await this.webpageCacheRepository.save({ webpage, date: new Date() });
    }
  }

  async updateWebpageAndCache(
    webpageId: string,
    updateWebpageDto: UpdateWebpageDto,
  ) {
    this.logger.log('updateWebpageAndCache called');

    // We're going to get the answer. If the answer is the same as before, we're going to add count++. If this becomes over 5+, then it'll be considered confirmed

    const webpageEntity = await this.webpageService.findOne(webpageId);
    let count = webpageEntity.webpageCache.count;
    webpageEntity.webpageCache.date = new Date();

    this.logger.log(updateWebpageDto.shopifySite);

    if (
      webpageEntity.inStock === updateWebpageDto.inStock &&
      +webpageEntity.price === updateWebpageDto.price &&
      webpageEntity.webpageCache.hash === updateWebpageDto.hash &&
      !updateWebpageDto.shopifySite
    ) {
      this.logger.log('count if activated');
      count++;
    }
    // if scenarios
    // 1) if hash is different, reset
    // 2) if hash is the same - count is below 3, still not enough confirmations
    // 3) If hass is the same - count is above 4,
    if (updateWebpageDto.shopifySite) {
      webpageEntity.webpageCache.count = 0;
      webpageEntity.webpageCache.confirmed = false;
    } else if (webpageEntity.webpageCache.hash !== updateWebpageDto.hash) {
      this.logger.log('if 1 activated');
      webpageEntity.webpageCache.hash = updateWebpageDto.hash;
      webpageEntity.webpageCache.count = 1;
      webpageEntity.webpageCache.confirmed = false;
    } else if (
      webpageEntity.webpageCache.hash === updateWebpageDto.hash &&
      webpageEntity.webpageCache.count < 4
    ) {
      this.logger.log('if 2 activated');
      webpageEntity.webpageCache.count = count;
    } else if (
      webpageEntity.webpageCache.hash === updateWebpageDto.hash &&
      count >= 3 &&
      !webpageEntity.webpageCache.confirmed
    ) {
      this.logger.log('if 3 activated');
      webpageEntity.webpageCache.confirmed = true;
    }

    // The Webpage will update as per normal
    await this.webpageCacheRepository.save(webpageEntity.webpageCache);
    await this.webpageService.update(webpageId, { ...updateWebpageDto });

    this.logger.log({
      webpageEntityPrice: +webpageEntity.price,
      updatedWebpageDtoPrice: updateWebpageDto.price,
      webpageEntityStock: webpageEntity.inStock,
      updateWebpageDtoInStock: updateWebpageDto.inStock,
    });

    this.logger.log(
      `has the page changed: ${
        +webpageEntity.price !== updateWebpageDto.price ||
        webpageEntity.inStock !== updateWebpageDto.inStock
      }`,
    );

    if (
      +webpageEntity.price !== updateWebpageDto.price ||
      webpageEntity.inStock !== updateWebpageDto.inStock
    ) {
      const productName = webpageEntity.shopProduct.product.urlSafeName;
      await fetch(
        `${process.env.WEBSITE_URL}/api/revalidate?secret=${process.env.WEBSITE_SECRET}&productName=${productName}`,
        { method: 'POST' },
      );

      this.logger.log(
        `${process.env.WEBSITE_URL}/api/revalidate?secret=${process.env.WEBSITE_SECRET}&productName=${productName}`,
      );
    }
  }

  findAll() {
    return `This action returns all webpageCache`;
  }

  findOne(id: number) {
    return `This action returns a #${id} webpageCache`;
  }

  async findOneByWebpageId(webpageId: string) {
    return this.webpageCacheRepository.findOne({
      where: {
        webpage: {
          id: webpageId,
        },
      },
      relations: {
        webpage: true,
      },
    });
  }

  update(id: number, updateWebpageCacheDto: UpdateWebpageCacheDto) {
    return `This action updates a #${id} webpageCache`;
  }

  remove(id: number) {
    return `This action removes a #${id} webpageCache`;
  }
}
