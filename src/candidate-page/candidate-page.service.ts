import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCandidatePageDto } from './dto/create-candidate-page.dto';
import { UpdateCandidatePageDto } from './dto/update-candidate-page.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CandidatePage } from './entities/candidate-page.entity';
import { IsNull, Repository } from 'typeorm';
import { ShopProductService } from 'src/shop-product/shop-product.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CheckPageDto } from 'src/webpage/entities/webpage.entity';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemoveWebpageDto } from 'src/webpage/dto/remove-webpage.dto';
import { WebpageService } from 'src/webpage/webpage.service';
import { CreateWebpageDto } from 'src/webpage/dto/create-webpage.dto';

@Injectable()
export class CandidatePageService {
  constructor(
    @Inject('HEADFUL_CLIENT') private headfulClient: ClientProxy,
    @Inject('HEADLESS_CLIENT') private readonly headlessClient: ClientProxy,
    @InjectRepository(CandidatePage)
    private candidatePageRepository: Repository<CandidatePage>,
    private webpageService: WebpageService,
    private shopProductService: ShopProductService,
    private eventEmitter: EventEmitter2,
  ) {}
  async create(
    createCandidatePageDto: CreateCandidatePageDto,
  ): Promise<CandidatePage> {
    console.log(createCandidatePageDto);
    const candidatePageExists = await this.candidatePageRepository.findOne({
      where: {
        url: createCandidatePageDto.url,
        shopProduct: {
          id: createCandidatePageDto.shopProductId,
        },
      },
    });

    const shopProductEntity = await this.shopProductService.findOne(
      createCandidatePageDto.shopProductId,
    );

    console.log(shopProductEntity);

    if (shopProductEntity.webPage?.url === createCandidatePageDto.url) {
      throw new ConflictException('The URL is already tracked');
    }

    if (candidatePageExists) {
      console.log('Candidate page already exists, updating instead');
      await this.update(candidatePageExists.id, {
        price: createCandidatePageDto.price,
        inStock: createCandidatePageDto.inStock,
        currencyCode: createCandidatePageDto.currencyCode,
        reason: createCandidatePageDto.reason,
        priceCheck: createCandidatePageDto.priceCheck,
        editionMatch: createCandidatePageDto.editionMatch,
        packagingTypeMatch: createCandidatePageDto.packagingTypeMatch,
        inspected: candidatePageExists.inspected,
        loadedData: createCandidatePageDto.loadedData,
        hasMixedSignals: createCandidatePageDto.hasMixedSignals,
      });
      const createCandidatePageDtoWithId = {
        ...createCandidatePageDto,
        id: candidatePageExists.id,
      };

      this.eventEmitter.emit(
        'candidatePage.foundExisting',
        createCandidatePageDtoWithId,
      );
      return this.findOne(candidatePageExists.id);
    } else {
      let candidatePageEntity: CandidatePage;
      try {
        candidatePageEntity = await this.candidatePageRepository.save({
          ...createCandidatePageDto,
          shopProduct: shopProductEntity,
          candidatePageCache: {},
        });
      } catch (error) {
        console.error(error);
        console.log('Error creating candidate page');
        console.log(createCandidatePageDto);
        throw new ConflictException('Error creating candidate page');
      }

      // console.log(candidatePageEntity);#
      console.log(createCandidatePageDto);
      console.log('Candidate page created');
      return candidatePageEntity;
    }
  }

  async findShopProductCandidatePage(
    shopProductId: string,
  ): Promise<CandidatePage> {
    return this.candidatePageRepository.findOne({
      where: {
        shopProduct: {
          id: shopProductId,
        },
      },
      relations: {
        candidatePageCache: true,
        shopProduct: true,
      },
    });
  }

  async checkPage(candidatePageId: string): Promise<void> {
    const page = await this.findOne(candidatePageId);
    const updatePageDto: CheckPageDto = {
      url: page.url,
      query: page.shopProduct.name,
      type: page.shopProduct.product.type,
      shopWebsite: page.shopProduct.shop.name,
      webPageId: page.id,
      shopifySite: page.shopProduct.shop.sitemapEntity.isShopifySite,
      hash: page.candidatePageCache.hash,
      confirmed: page.candidatePageCache.confirmed,
      count: page.candidatePageCache.count,
      cloudflare: page.shopProduct.shop.cloudflare,
      variantId: page.variantId,
      headless: page.shopProduct.shop.headless,
      country: page.shopProduct.shop.country,
      currency: page.shopProduct.shop.country,
    };
    console.log(page);
    if (
      page.shopProduct.shop.sitemapEntity.isShopifySite === true &&
      page.shopProduct.shop.cloudflare === false
    ) {
      this.headlessClient.emit('updatePage', updatePageDto);
    } else {
      this.headfulClient.emit('updatePage', updatePageDto);
    }
  }

  async findAllPriceMatchEditionMatch() {
    return this.candidatePageRepository.find({
      where: {
        priceCheck: true,
        editionMatch: true,
        inspected: false,
        loadedData: true,
      },
      relations: {
        shopProduct: true,
      },
      select: {
        id: true,
        url: true,
        price: true,
        reason: true,
        pageTitle: true,
        shopProduct: {
          id: true,
          name: true,
          shopId: true,
          links: true,
        },
      },
    });
  }

  async findAllEditionMatch() {
    return this.candidatePageRepository.find({
      where: {
        editionMatch: true,
        // packagingTypeMatch: true,
        inspected: false,
        loadedData: true,
      },
      relations: {
        shopProduct: true,
      },
      select: {
        id: true,
        url: true,
        price: true,
        reason: true,
        pageTitle: true,
        priceCheck: true,
        shopProduct: {
          id: true,
          name: true,
          shopId: true,
          links: true,
        },
      },
    });
  }

  async findAllMixedSignalsEditionMatch() {
    return this.candidatePageRepository.find({
      where: {
        hasMixedSignals: true,
        editionMatch: true,
        inspected: false,
        loadedData: true,
      },
      relations: {
        shopProduct: true,
      },
      select: {
        id: true,
        url: true,
        price: true,
        reason: true,
        pageTitle: true,
        shopProduct: {
          id: true,
          name: true,
          shopId: true,
          links: true,
        },
      },
    });
  }

  async batchRemoveCandidatePages() {
    const candidatePagesToInspect = await this.findAllLoaded();
    for (const page of candidatePagesToInspect) {
      this.eventEmitter.emit('blacklist.candidate.pages', {
        pageId: page.id,
        pageType: 'CP',
      });
    }
    return true;
  }

  async findAll(): Promise<CandidatePage[]> {
    return this.candidatePageRepository.find({
      where: {},
      relations: { shopProduct: true },
    });
  }

  async findAllLoaded(): Promise<CandidatePage[]> {
    return this.candidatePageRepository.find({
      where: { loadedData: true },
      relations: { shopProduct: true },
    });
  }

  async findOne(id: string) {
    const candidatePageEntity = await this.candidatePageRepository.findOne({
      where: { id },
      relations: {
        candidatePageCache: true,
        shopProduct: {
          product: true,
          shop: {
            sitemapEntity: true,
          },
        },
      },
    });
    if (!candidatePageEntity)
      throw new NotFoundException('candidate_page_not_found');
    return candidatePageEntity;
  }

  async findOneByUrl(url: string): Promise<CandidatePage> {
    const entity = await this.candidatePageRepository.findOne({
      where: { url },
      relations: {
        shopProduct: {
          shopProductBlacklistUrls: true,
        },
      },
    });
    return entity;
  }

  async updateInspected(id: string) {
    return this.update(id, { inspected: true });
  }

  async update(id: string, updateCandidatePageDto: UpdateCandidatePageDto) {
    return this.candidatePageRepository.update(id, updateCandidatePageDto);
  }

  @OnEvent('remove.candidatePage')
  async remove(id: string) {
    const candidatePageEntity = await this.candidatePageRepository.findOne({
      where: {
        id,
      },
    });
    return this.candidatePageRepository.remove(candidatePageEntity);
  }

  @OnEvent('webpage.remove')
  async removeByShopProductId(removeWebpageDto: RemoveWebpageDto) {
    console.log('webpage.remove event fired');
    const candidatePageEntity = await this.candidatePageRepository.findOne({
      where: {
        url: removeWebpageDto.url,
        shopProduct: {
          id: removeWebpageDto.shopProductId,
        },
      },
      relations: {
        shopProduct: true,
      },
    });
    if (candidatePageEntity === null) return;
    await this.candidatePageRepository.remove(candidatePageEntity);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async removeNull() {
    const candidatePages = await this.candidatePageRepository.find({
      relations: {
        shopProduct: true,
      },
      where: {
        shopProduct: IsNull(),
      },
    });
    for (const candidatePage of candidatePages) {
      await this.remove(candidatePage.id);
    }
  }

  async createWebpageRemoveCandidatePage(id: string) {
    const candidatePage = await this.findOne(id);
    const webpageDto: CreateWebpageDto = {
      url: candidatePage.url,
      shopWebsite: candidatePage.shopProduct.shop.name,
      inStock: candidatePage.inStock,
      price: candidatePage.price,
      currencyCode: candidatePage.currencyCode,
      productName: candidatePage.shopProduct.name,
      productId: candidatePage.shopProduct.productId,
      shopId: candidatePage.shopProduct.shop.id,
      reason: candidatePage.reason,
    };
    await this.webpageService.create(webpageDto);
    return this.remove(id);
  }

  async removeCandidatePagesWithWebpages() {
    const candidatePages = await this.candidatePageRepository.find({
      where: {
        shopProduct: {
          populated: true,
        },
      },
      relations: {
        shopProduct: {
          webPage: true,
        },
      },
    });
    await this.candidatePageRepository.remove(candidatePages);
  }

  async removeCandidatePagesEdidtionMatchFalse() {
    const candidatePages = await this.candidatePageRepository.find({
      where: {
        editionMatch: false,
      },
    });
    console.log(candidatePages.length);
    for (const page of candidatePages) {
      this.eventEmitter.emit('blacklist.candidate.pages', {
        pageId: page.id,
        pageType: 'CP',
      });
    }
  }

  async removeSingleCandidatePage(id: string) {
    const candidatePages = await this.candidatePageRepository.findOne({
      where: {
        id,
      },
    });
    this.eventEmitter.emit('blacklist.candidate.pages', {
      pageId: candidatePages.id,
      pageType: 'CP',
    });
  }
}
