import { Injectable } from '@nestjs/common';
import { CreateMarketDto } from './dto/create-market.dto';
import { UpdateMarketDto } from './dto/update-market.dto';
import { WebpageSnapshotService } from 'src/webpage-snapshot/webpage-snapshot.service';
import { ProductService } from 'src/product/product.service';
import { WebpageService } from 'src/webpage/webpage.service';
import { MarketPayload } from './entities/market.entity';
import { stringify } from 'yaml';
import { encode, decode } from '@toon-format/toon';
import { SnapshotSlim } from 'src/webpage-snapshot/entities/webpage-snapshot.entity';

@Injectable()
export class MarketService {
  constructor(
    private productService: ProductService,
    private webpageService: WebpageService,
    private webpageSnapshotService: WebpageSnapshotService,
  ) {}
  create(createMarketDto: CreateMarketDto) {
    return 'This action adds a new market';
  }

  findAll() {
    return `This action returns all market`;
  }

  findOne(id: number) {
    return `This action returns a #${id} market`;
  }

  update(id: number, updateMarketDto: UpdateMarketDto) {
    return `This action updates a #${id} market`;
  }

  remove(id: number) {
    return `This action removes a #${id} market`;
  }

  async marketResearch() {
    const populatedProducts =
      await this.productService.findAllProductsWithWebPages();

    const payload: MarketPayload[] = [];

    function shortId(uuid: string, length = 8) {
      return uuid.replaceAll('-', '').slice(0, length);
    }

    for (const product of populatedProducts) {
      try {
        const webpages =
          await this.webpageService.findAllWebpagesDividedByProductsStockStateShopInfoSlimMinimal(
            true,
            product.urlSafeName,
          );
        const snapshots =
          await this.webpageSnapshotService.findAllByProductIdRelations(
            product.id,
          );

        const amendedSnapshot: SnapshotSlim[] = await Promise.all(
          snapshots.map(async ({ webpage, ...snapshot }) => {
            const { inStock, price, euroPrice, currencyCode, createdAt } =
              snapshot;

            const shopId = (
              await this.webpageService.findOneByUrl(snapshot.url)
            ).shopProduct.shop.id;

            return {
              inStock,
              price,
              euroPrice,
              currencyCode,
              createdAt,
              shopId: shortId(shopId),
            };
          }),
        );

        const uuidUpdatedWebpages = webpages.webPages.map((webpage) => {
          return {
            ...webpage,
            shopId: shortId(webpage.shopId),
          };
        });

        const marketSnapshot: MarketPayload = {
          productName: product.name,
          webpages: uuidUpdatedWebpages,
          snapshots: await amendedSnapshot,
        };

        payload.push(marketSnapshot);
      } catch (error) {
        console.log(error);
        continue;
      }
    }

    const text = stringify(payload, {
      lineWidth: 0,
    });

    const toon = encode(payload);

    return toon;
  }
}
