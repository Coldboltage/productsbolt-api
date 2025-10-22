import { Test, TestingModule } from '@nestjs/testing';
import { ShopListingController } from './shop-listing.controller';
import { ShopListingService } from './shop-listing.service';

describe('ShopListingController', () => {
  let controller: ShopListingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopListingController],
      providers: [ShopListingService],
    }).compile();

    controller = module.get<ShopListingController>(ShopListingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
