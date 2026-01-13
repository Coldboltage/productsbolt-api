import { Test, TestingModule } from '@nestjs/testing';
import { ShopProductBacklistUrlController } from './shop-product-backlist-url.controller';
import { ShopProductBacklistUrlService } from './shop-product-backlist-url.service';

describe('ShopProductBacklistUrlController', () => {
  let controller: ShopProductBacklistUrlController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopProductBacklistUrlController],
      providers: [ShopProductBacklistUrlService],
    }).compile();

    controller = module.get<ShopProductBacklistUrlController>(ShopProductBacklistUrlController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
