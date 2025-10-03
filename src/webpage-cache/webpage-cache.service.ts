import { Injectable } from '@nestjs/common';
import { CreateWebpageCacheDto } from './dto/create-webpage-cache.dto';
import { UpdateWebpageCacheDto } from './dto/update-webpage-cache.dto';
import { WebpageService } from '../webpage/webpage.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebpageCache } from './entities/webpage-cache.entity';
import { UpdateWebpageDto } from 'src/webpage/dto/update-webpage.dto';

@Injectable()
export class WebpageCacheService {
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
      if (
        webpage.scrappedPage.scrappedPageCache &&
        webpage.scrappedPage.scrappedPageCache.id
      )
        continue;
      await this.webpageCacheRepository.save({ webpage, date: new Date() });
    }
  }

  async updateWebpageAndCache(
    webpageId: string,
    updateWebpageDto: UpdateWebpageDto,
  ) {
    console.log('updateWebpageAndCache called');

    // We're going to get the answer. If the answer is the same as before, we're going to add count++. If this becomes over 5+, then it'll be considered confirmed

    const webpageEntity = await this.webpageService.findOne(webpageId);
    let count = webpageEntity.scrappedPage.scrappedPageCache.count;
    webpageEntity.scrappedPage.scrappedPageCache.date = new Date();

    console.log(updateWebpageDto.shopifySite);

    if (
      webpageEntity.inStock === updateWebpageDto.inStock &&
      +webpageEntity.price === updateWebpageDto.price &&
      webpageEntity.scrappedPage.scrappedPageCache.hash ===
        updateWebpageDto.hash &&
      !updateWebpageDto.shopifySite
    ) {
      console.log('count if activated');
      count++;
    }
    // if scenarios
    // 1) if hash is different, reset
    // 2) if hash is the same - count is below 3, still not enough confirmations
    // 3) If hass is the same - count is above 4,
    if (updateWebpageDto.shopifySite) {
      webpageEntity.scrappedPage.scrappedPageCache.count = 0;
      webpageEntity.scrappedPage.scrappedPageCache.confirmed = false;
    } else if (
      webpageEntity.scrappedPage.scrappedPageCache.hash !==
      updateWebpageDto.hash
    ) {
      console.log('if 1 activated');
      webpageEntity.scrappedPage.scrappedPageCache.hash = updateWebpageDto.hash;
      webpageEntity.scrappedPage.scrappedPageCache.count = 1;
      webpageEntity.scrappedPage.scrappedPageCache.confirmed = false;
    } else if (
      webpageEntity.scrappedPage.scrappedPageCache.hash ===
        updateWebpageDto.hash &&
      webpageEntity.scrappedPage.scrappedPageCache.count < 5
    ) {
      console.log('if 2 activated');
      webpageEntity.scrappedPage.scrappedPageCache.count = count;
    } else if (
      webpageEntity.scrappedPage.scrappedPageCache.hash ===
        updateWebpageDto.hash &&
      count >= 4 &&
      !webpageEntity.scrappedPage.scrappedPageCache.confirmed
    ) {
      console.log('if 3 activated');
      webpageEntity.scrappedPage.scrappedPageCache.confirmed = true;
    }

    // The Webpage will update as per normal
    await this.webpageCacheRepository.save(
      webpageEntity.scrappedPage.scrappedPageCache,
    );
    await this.webpageService.update(webpageId, { ...updateWebpageDto });
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
        scrappedPage: {
          webpage: { id: webpageId },
        },
      },
      relations: {
        scrappedPage: {
          webpage: true,
        },
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
