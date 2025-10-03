import { Injectable } from '@nestjs/common';
import { CreateScrappedPageDto } from './dto/create-scrapped-page.dto';
import { UpdateScrappedPageDto } from './dto/update-scrapped-page.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ScrappedPage } from './entities/scrapped-page.entity';
import { Repository } from 'typeorm';
import { ShopProductService } from 'src/shop-product/shop-product.service';

@Injectable()
export class ScrappedPageService {
  constructor(
    @InjectRepository(ScrappedPage)
    private scrappedPageRepository: Repository<ScrappedPage>,
    private shopProductService: ShopProductService,
  ) {}

  // The normal general use of creating. We assume no webpage has assiocation
  async create(createScrappedPageDto: CreateScrappedPageDto) {
    const shopProductEntity = await this.shopProductService.findOne(
      createScrappedPageDto.shopProductId,
    );
    const scrappedPageEntity = this.scrappedPageRepository.create(
      createScrappedPageDto,
    );
    scrappedPageEntity.unconfirmedPages.push(shopProductEntity);
    const savedScrappedPageEntity =
      await this.scrappedPageRepository.save(scrappedPageEntity);

    return savedScrappedPageEntity;
  }

  // Bulk create from existing webpages
  async createFromExistingShopProducts() {
    const shopProducts = await this.shopProductService.findAll();
    const shopProductsWithWebsites = shopProducts.filter(
      (shopProduct) => shopProduct.webPage,
    );

    for (const shopProduct of shopProductsWithWebsites) {
      const { url, pageTitle, pageAllText } = shopProduct.webPage;
      const scrappedPageEntity = await this.scrappedPageRepository.save({
        url,
        pageTitle,
        pageAllText,
        shopProductId: shopProduct.id,
        webpage: shopProduct.webPage,
        shopProduct,
        scrappedPageCache: shopProduct.webPage.webpageCache,
      });
      return scrappedPageEntity;
    }
  }

  findAll() {
    return `This action returns all scrappedPage`;
  }

  findOne(id: number) {
    return `This action returns a #${id} scrappedPage`;
  }

  async update(id: number, updateScrappedPageDto: UpdateScrappedPageDto) {
    return this.scrappedPageRepository.update(id, updateScrappedPageDto);
  }

  remove(id: number) {
    return `This action removes a #${id} scrappedPage`;
  }
}
