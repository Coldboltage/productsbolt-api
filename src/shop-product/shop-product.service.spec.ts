import { Test, TestingModule } from '@nestjs/testing';
import { ShopProductService } from './shop-product.service';

describe('ShopProductService', () => {
  let service: ShopProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopProductService],
    }).compile();

    service = module.get<ShopProductService>(ShopProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
