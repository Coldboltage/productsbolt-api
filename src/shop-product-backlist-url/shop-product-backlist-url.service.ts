import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { shopProductBlacklistUrl } from './entities/shop-product-blacklist-url.entity';
import { Repository } from 'typeorm';
import { CreateShopProductBlacklistUrlDto } from './dto/create.dto';

@Injectable()
export class ShopProductBacklistUrlService {
  constructor(
    @InjectRepository(shopProductBlacklistUrl)
    private shopProductBlacklistRepository: Repository<shopProductBlacklistUrl>,
  ) {}
  async create(
    createShopProductBlacklistUrlDto: CreateShopProductBlacklistUrlDto,
  ): Promise<shopProductBlacklistUrl> {
    return await this.shopProductBlacklistRepository.save({
      shopProduct: { id: createShopProductBlacklistUrlDto.shopProductId },
      blackListUrl: { id: createShopProductBlacklistUrlDto.blackListId },
    });
  }
}
