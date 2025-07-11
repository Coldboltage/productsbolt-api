import { Injectable } from '@nestjs/common';
import { CreateBlackListUrlDto } from './dto/create-blacklist-url.dto';
import { UpdateBlackListUrlDto } from './dto/update-blacklist-url.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BlackListUrl } from './entities/blacklist-url.entity';
import { Repository } from 'typeorm';
import { ShopProductService } from '../shop-product/shop-product.service';
import { WebpageService } from '../webpage/webpage.service';

@Injectable()
export class BlackListUrlService {
  constructor(
    @InjectRepository(BlackListUrl)
    private blackListRepository: Repository<BlackListUrl>,
    private shopProductsService: ShopProductService,
    private webPageService: WebpageService,
  ) { }
  async create(createBlackListUrlDto: CreateBlackListUrlDto) {
    const webpageEntity = await this.webPageService.findOneByUrl(
      createBlackListUrlDto.url,
    );

    const blackListEntity = this.blackListRepository.create({
      url: webpageEntity.url,
      shopProducts: [webpageEntity.shopProduct],
    });

    console.log(webpageEntity)

    await this.shopProductsService.update(webpageEntity.shopProduct.id, {
      populated: false,
    });

    const response = await this.webPageService.removeWebpage(
      createBlackListUrlDto.url,
    );
    if (!response) throw new Error('page might not have been deleted')
    return this.blackListRepository.save<BlackListUrl>(blackListEntity);
  }

  findAll() {
    return `This action returns all BlackListUrl`;
  }

  async findOne(id: string) {
    return this.blackListRepository.findOne({
      where: {
        id,
      },
    });
  }

  async findOneByUrl(url: string) {
    return this.blackListRepository.findOne({
      where: {
        url,
      },
    });
  }

  update(id: number, updateBlackListUrlDto: UpdateBlackListUrlDto) {
    return `This action updates a #${id} BlackListUrl`;
  }

  remove(id: number) {
    return `This action removes a #${id} BlackListUrl`;
  }
}
