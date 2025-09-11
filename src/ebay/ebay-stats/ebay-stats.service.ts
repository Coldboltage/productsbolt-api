import { Injectable } from '@nestjs/common';
import { CreateEbayStatDto } from './dto/create-ebay-stat.dto';
import { UpdateEbayStatDto } from './dto/update-ebay-stat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CalculatedPricePoints,
  EbayStat,
  PricePoints,
} from './entities/ebay-stat.entity';
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
  async create(createEbayStatDto: CreateEbayStatDto): Promise<EbayStat> {
    console.log(createEbayStatDto);
    const productEntity = await this.productService.findOne(
      createEbayStatDto.productId,
    );

    return this.ebayStatRepository.save({
      ...createEbayStatDto,
      product: productEntity,
    });
  }

  async bestWebpageToCalc(): Promise<void> {
    const products = await this.productService.findAllWithEbayStat();
    for (const product of products) {
      console.log(product);
      const { minPrice, averagePrice, maxPrice, id, minActivePrice } =
        product.ebayStat;
      const webpageProduct = (
        await this.webpageService.findAllByProductStock(true, product.id)
      ).at(0);

      if (!webpageProduct) continue;

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
  ): CalculatedPricePoints {
    const clearPrice = Math.max(cost, minSold, minActive ?? -Infinity);
    const jitPrice = Math.min(Math.max(avgSold, clearPrice), maxSold);
    const maximisedPrice = maxSold;
    return { clearPrice, jitPrice, maximisedPrice };
  }

  async nextProductToSell(): Promise<PricePoints[]> {
    console.log('nextProductToSell fired');
    await this.bestWebpageToCalc();

    const products = await this.productService.findAllWithEbayStat();

    const roiCalc = (sellPrice: number, buyPrice: number) => {
      return Math.round(((sellPrice - buyPrice) / buyPrice) * 100);
    };
    const roiProducts: PricePoints[] = [];
    for (const product of products) {
      if (!product.ebayStat) continue;

      const webpages = await this.webpageService.findAllByProductStock(
        true,
        product.id,
      );
      if (webpages.length === 0) continue;
      console.log(webpages);
      const cheapestWebpage = webpages.at(0);

      console.log(cheapestWebpage);

      console.log({
        name: cheapestWebpage.url,
        price: cheapestWebpage.price,
      });

      const { clearPrice, jitPrice, maximisedPrice } = product.ebayStat;

      const clearPriceRoi = roiCalc(clearPrice, cheapestWebpage.price);
      const jitPriceeRoi = roiCalc(jitPrice, cheapestWebpage.price);
      const maximisedPriceRoi = roiCalc(maximisedPrice, cheapestWebpage.price);

      roiProducts.push({
        name: product.name,
        webpage: cheapestWebpage.url,
        price: cheapestWebpage.price,
        clearPriceRoi: {
          price: clearPrice,
          roi: clearPriceRoi,
        },
        jitPriceeRoi: {
          price: jitPrice,
          roi: jitPriceeRoi,
        },
        maximisedPriceRoi: {
          price: maximisedPrice,
          roi: maximisedPriceRoi,
        },
      });
    }

    console.log(roiProducts);

    roiProducts.sort(
      (a, b) => b.maximisedPriceRoi.price - a.maximisedPriceRoi.price,
    );
    console.log(roiProducts);

    const highestRoi = roiProducts.at(0);
    console.log(highestRoi);
    return roiProducts;
  }

  async findAll(): Promise<EbayStat[]> {
    return this.ebayStatRepository.find({
      relations: {
        product: true,
      }
    });
  }

  async findOne(id: string): Promise<EbayStat> {
    return this.ebayStatRepository.findOne({
      where: {
        id,
      },
      relations: {
        product: true,
      }
    });
  }

  async update(id: string, updateEbayStatDto: UpdateEbayStatDto) {
    return this.ebayStatRepository.update(id, updateEbayStatDto);
  }

  async patchAndUpdatePricePoints(
    id: string,
    updateEbayStatDto: UpdateEbayStatDto,
  ) {
    await this.update(id, updateEbayStatDto);
    return this.nextProductToSell();
  }

  async remove(id: string): Promise<EbayStat> {
    const ebayStatEntity = await this.findOne(id);
    return this.ebayStatRepository.remove(ebayStatEntity);
  }
}
