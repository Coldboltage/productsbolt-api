import { Test, TestingModule } from '@nestjs/testing';
import { ShopListingService } from './shop-listing.service';

describe('ShopListingService', () => {
  let service: ShopListingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopListingService],
    }).compile();

    service = module.get<ShopListingService>(ShopListingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
