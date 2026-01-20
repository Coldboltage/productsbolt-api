import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateShopProductBlacklistUrlDto } from './dto/create.dto';
import { ShopProductBlacklistUrl } from './entities/shop-product-blacklist-url.entity';

@Injectable()
export class ShopProductBacklistUrlService {
  constructor(
    @InjectRepository(ShopProductBlacklistUrl)
    private shopProductBlacklistRepository: Repository<ShopProductBlacklistUrl>,
  ) {}
  async create(
    createShopProductBlacklistUrlDto: CreateShopProductBlacklistUrlDto,
  ): Promise<ShopProductBlacklistUrl> {
    return await this.shopProductBlacklistRepository.save({
      shopProduct: { id: createShopProductBlacklistUrlDto.shopProductId },
      blackListUrl: { id: createShopProductBlacklistUrlDto.blackListId },
    });
  }
}
