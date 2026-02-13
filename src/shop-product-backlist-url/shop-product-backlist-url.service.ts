import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateShopProductBlacklistUrlDto } from './dto/create.dto';
import { ShopProductBlacklistUrl } from './entities/shop-product-blacklist-url.entity';
import { ShopProductService } from 'src/shop-product/shop-product.service';
import { BlackListUrlService } from 'src/blacklist-url/blacklist-url.service';
import { PageType } from './shop-product-blacklist-url.types';
import { BlackListUrl } from 'src/blacklist-url/entities/blacklist-url.entity';
import { ShopProduct } from 'src/shop-product/entities/shop-product.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { CandidatePageService } from 'src/candidate-page/candidate-page.service';

@Injectable()
export class ShopProductBacklistUrlService {
  constructor(
    @InjectRepository(ShopProductBlacklistUrl)
    private shopProductBlacklistRepository: Repository<ShopProductBlacklistUrl>,
    private shopProductService: ShopProductService,
    private blacklistUrlService: BlackListUrlService,
    private candidatePageService: CandidatePageService,
  ) {}
  @OnEvent('blacklist.candidate.pages')
  async create(
    createShopProductBlacklistUrlDto: CreateShopProductBlacklistUrlDto,
  ): Promise<ShopProductBlacklistUrl> {
    let blackListUrlEntity: BlackListUrl = new BlackListUrl();
    let shopProductEntity: ShopProduct = new ShopProduct();

    switch (createShopProductBlacklistUrlDto.pageType) {
      case PageType.WP:
        shopProductEntity = await this.shopProductService.findOneByWebpageId(
          createShopProductBlacklistUrlDto.pageId,
        );
        blackListUrlEntity = await this.blacklistUrlService.create({
          url: createShopProductBlacklistUrlDto.pageId,
        });
        break;
      case PageType.CP:
        shopProductEntity =
          await this.shopProductService.findOneByCandidatePageId(
            createShopProductBlacklistUrlDto.pageId,
          );

        blackListUrlEntity =
          await this.blacklistUrlService.createFromCandidatePage(
            createShopProductBlacklistUrlDto.pageId,
          );
    }

    const shopProductBlackListEntity =
      await this.shopProductBlacklistRepository.save({
        shopProduct: shopProductEntity,
        blackListUrl: blackListUrlEntity,
      });

    await this.shopProductService.checkForIndividualShopProduct(
      shopProductEntity.id,
    );

    return shopProductBlackListEntity;
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
