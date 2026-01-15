import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateCandidatePageDto } from './dto/create-candidate-page.dto';
import { UpdateCandidatePageDto } from './dto/update-candidate-page.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CandidatePage } from './entities/candidate-page.entity';
import { IsNull, Repository } from 'typeorm';
import { ShopProductService } from 'src/shop-product/shop-product.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CheckPageDto } from 'src/webpage/entities/webpage.entity';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CandidatePageService {
  constructor(
    @Inject('HEADFUL_CLIENT') private headfulClient: ClientProxy,
    @Inject('HEADLESS_CLIENT') private readonly headlessClient: ClientProxy,
    @InjectRepository(CandidatePage)
    private candidatePageRepository: Repository<CandidatePage>,
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
          shopId: createCandidatePageDto.shopId,
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
      shopifySite: page.shopProduct.shop.isShopifySite,
      hash: page.candidatePageCache.hash,
      confirmed: page.candidatePageCache.confirmed,
      count: page.candidatePageCache.count,
      cloudflare: page.shopProduct.shop.cloudflare,
    };
    console.log(page);
    if (page.shopProduct.shop.isShopifySite === true) {
      this.headlessClient.emit('updatePage', updatePageDto);
    } else {
      this.headfulClient.emit('updatePage', updatePageDto);
    }
  }

  findAll() {
    return `This action returns all candidatePage`;
  }

  async findOne(id: string) {
    return this.candidatePageRepository.findOne({
      where: { id },
      relations: {
        candidatePageCache: true,
        shopProduct: {
          product: true,
          shop: true,
        },
      },
    });
  }

  async update(id: string, updateCandidatePageDto: UpdateCandidatePageDto) {
    return this.candidatePageRepository.update(id, updateCandidatePageDto);
  }

  remove(id: number) {
    return `This action removes a #${id} candidatePage`;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async removeNull() {
    return this.candidatePageRepository.find({
      relations: {
        shopProduct: true,
      },
      where: {
        shopProduct: IsNull(),
      },
    });
  }
}
