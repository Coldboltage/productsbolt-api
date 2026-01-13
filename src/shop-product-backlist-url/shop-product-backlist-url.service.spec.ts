import { Test, TestingModule } from '@nestjs/testing';
import { ShopProductBacklistUrlService } from './shop-product-backlist-url.service';

describe('ShopProductBacklistUrlService', () => {
  let service: ShopProductBacklistUrlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopProductBacklistUrlService],
    }).compile();

    service = module.get<ShopProductBacklistUrlService>(ShopProductBacklistUrlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
