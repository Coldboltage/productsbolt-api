import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateShopProductBlacklistUrlDto } from './dto/create.dto';
import { ShopProductBlacklistUrl } from './entities/shop-product-blacklist-url.entity';
import { ShopProductService } from 'src/shop-product/shop-product.service';
import { BlackListUrlService } from 'src/blacklist-url/blacklist-url.service';

@Injectable()
export class ShopProductBacklistUrlService {
  constructor(
    @InjectRepository(ShopProductBlacklistUrl)
    private shopProductBlacklistRepository: Repository<ShopProductBlacklistUrl>,
    private shopProductService: ShopProductService,
    private blacklistUrlService: BlackListUrlService,
  ) {}
  async create(
    createShopProductBlacklistUrlDto: CreateShopProductBlacklistUrlDto,
  ): Promise<ShopProductBlacklistUrl> {
    const shopProductEntity = await this.shopProductService.findOneByWebpageUrl(
      createShopProductBlacklistUrlDto.webpageUrl,
    );

    const blackListUrlEntity = await this.blacklistUrlService.create({
      url: createShopProductBlacklistUrlDto.webpageUrl,
    });

    return this.shopProductBlacklistRepository.save({
      shopProduct: shopProductEntity,
      blackListUrl: blackListUrlEntity,
    });
  }

  async findAll() {
    return this.shopProductBlacklistRepository.find({
      relations: {
        shopProduct: true,
        blackListUrl: true,
      },
    });
  }
}
