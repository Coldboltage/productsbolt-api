import { Injectable } from '@nestjs/common';
import { CreateEbayStatDto } from './dto/create-ebay-stat.dto';
import { UpdateEbayStatDto } from './dto/update-ebay-stat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EbayStat } from './entities/ebay-stat.entity';
import { Repository } from 'typeorm';
import { ProductService } from '../../product/product.service';
import { WebpageService } from '../../webpage/webpage.service';

@Injectable()
export class EbayStatsService {
  constructor(
    @InjectRepository(EbayStat)
    private ebayStatRepository: Repository<EbayStat>,
    private productService: ProductService,
    private webpageService: WebpageService,
  ) { }
  async create(createEbayStatDto: CreateEbayStatDto) {
    console.log(createEbayStatDto);
    const productEntity = await this.productService.findOne(
      createEbayStatDto.productId,
    );

    return this.ebayStatRepository.save({
      ...createEbayStatDto,
      product: productEntity,
    });
  }

  async bestWebpageToCalc() {
    const products = await this.productService.findAllWithEbayStat();
    for (const product of products) {
      const { minPrice, averagePrice, maxPrice, id, minActivePrice } =
        product.ebayStat;
      const webpageProduct = (
        await this.webpageService.findAllByProductStock(true, product.id)
      ).at(0);

      const calculatedPrices = this.calculateCost(
        webpageProduct.price,
        minPrice,
        averagePrice,
        maxPrice,
        minActivePrice,
      );

      await this.update(id, {
        ...calculatedPrices,
      });
    }
  }

  calculateCost(
    cost: number,
    minSold: number,
    avgSold: number,
    maxSold: number,
    minActive: number,
  ) {
    const clearPrice = Math.max(cost, minSold, minActive ?? -Infinity);
    const jitPrice = Math.min(Math.max(avgSold, clearPrice), maxSold);
    const maximisedPrice = maxSold;
    return { clearPrice, jitPrice, maximisedPrice };
  }

  findAll() {
    return `This action returns all ebayStats`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ebayStat`;
  }

  async update(id: string, updateEbayStatDto: UpdateEbayStatDto) {
    return this.ebayStatRepository.update(id, updateEbayStatDto);
  }

  remove(id: number) {
    return `This action removes a #${id} ebayStat`;
  }
}
