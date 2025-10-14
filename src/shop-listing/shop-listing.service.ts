import { Injectable } from '@nestjs/common';
import { CreateShopListingDto } from './dto/create-shop-listing.dto';
import { UpdateShopListingDto } from './dto/update-shop-listing.dto';
import { ShopListing } from './entities/shop-listing.entity';
import { Repository } from 'typeorm';
import { ShopService } from 'src/shop/shop.service';
import { InjectRepository } from '@nestjs/typeorm';
import { DiscordService } from 'src/discord/discord.service';

@Injectable()
export class ShopListingService {
  constructor(
    @InjectRepository(ShopListing)
    private shopListingRepository: Repository<ShopListing>,
    private shopService: ShopService,
    private discordService: DiscordService,
  ) {}
  create(createShopListingDto: CreateShopListingDto) {
    return 'This action adds a new shopListing';
  }

  findAll() {
    return `This action returns all shopListing`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shopListing`;
  }

  update(id: string, updateShopListingDto: UpdateShopListingDto) {
    return `This action updates a #${id} shopListing`;
  }

  async addProductListing(
    id: string,
    updateShopListingDto: UpdateShopListingDto,
  ) {
    const shopEntity = await this.shopService.findOne(id);

    console.log(shopEntity);

    for (const listing of updateShopListingDto.newListing) {
      const listingEntity = await this.shopListingRepository.save({
        listingName: listing.listingName,
        listingUrl: listing.linkListing,
        price: listing.listingPrice,
        shop: shopEntity,
      });

      if (process.env.DISCORD_ALERTS === 'true') {
        await this.discordService.newProduct(
          `A new product listing has been found: ${listing.listingName} for ${listing.linkListing}`,
          listing.linkListing,
        );
      }
      console.log('Saved listing entity:', listingEntity);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} shopListing`;
  }
}
