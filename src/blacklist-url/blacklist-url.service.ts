import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBlackListUrlDto } from './dto/create-blacklist-url.dto';
import { UpdateBlackListUrlDto } from './dto/update-blacklist-url.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BlackListUrl } from './entities/blacklist-url.entity';
import { DeleteResult, Repository } from 'typeorm';
import { ShopProductService } from '../shop-product/shop-product.service';
import { WebpageService } from '../webpage/webpage.service';

@Injectable()
export class BlackListUrlService {
  constructor(
    @InjectRepository(BlackListUrl)
    private blackListRepository: Repository<BlackListUrl>,
    private shopProductsService: ShopProductService,
    private webPageService: WebpageService,
  ) {}
  async create(
    createBlackListUrlDto: CreateBlackListUrlDto,
  ): Promise<BlackListUrl> {
    const webpageEntity = await this.webPageService.findOneByUrl(
      createBlackListUrlDto.url,
    );

    const urlExist = await this.findOneByUrl(createBlackListUrlDto.url);
    let blackListEntity: BlackListUrl;

    if (!webpageEntity) throw new NotFoundException('webpage_does_not_exist');

    if (urlExist) {
      console.log(urlExist);
      urlExist.shopProducts.push(webpageEntity.shopProduct);
      await this.blackListRepository.save(urlExist);
    } else {
      blackListEntity = this.blackListRepository.create({
        url: webpageEntity.url,
        shopProducts: [webpageEntity.shopProduct],
      });
    }

    console.log(webpageEntity);

    await this.shopProductsService.update(webpageEntity.shopProduct.id, {
      populated: false,
    });

    const response = await this.webPageService.removeWebpage(webpageEntity.id);
    if (!response) throw new Error('page might not have been deleted');

    blackListEntity =
      await this.blackListRepository.save<BlackListUrl>(blackListEntity);

    await this.shopProductsService.checkForIndividualShopProduct(
      webpageEntity.shopProduct.id,
    );

    return blackListEntity;
  }

  // Return all Blacklst Urls
  async findAll(): Promise<BlackListUrl[]> {
    return this.blackListRepository.find({});
  }

  // Find a specific Blacklist Url
  async findOne(id: string): Promise<BlackListUrl> {
    return this.blackListRepository.findOne({
      where: {
        id,
      },
    });
  }

  // Find one by URL. A url will always be tied to one Blacklist URL.
  async findOneByUrl(url: string): Promise<BlackListUrl> {
    return this.blackListRepository.findOne({
      where: {
        url,
      },
      relations: { shopProducts: true },
    });
  }

  async findByShopProduct(shopProductId: string): Promise<BlackListUrl[]> {
    return this.blackListRepository.find({
      where: {
        shopProducts: {
          id: shopProductId,
        },
      },
    });
  }

  // Update a single Blacklist Url
  async update(id: string, updateBlackListUrlDto: UpdateBlackListUrlDto) {
    return this.blackListRepository.update(id, updateBlackListUrlDto);
  }

  // Remove a single Blacklist Url
  async remove(id: string): Promise<DeleteResult> {
    return this.blackListRepository.delete(id);
  }
}
