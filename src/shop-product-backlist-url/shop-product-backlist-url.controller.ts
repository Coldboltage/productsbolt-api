import { Controller } from '@nestjs/common';
import { ShopProductBacklistUrlService } from './shop-product-backlist-url.service';

@Controller('shop-product-backlist-url')
export class ShopProductBacklistUrlController {
  constructor(private readonly shopProductBacklistUrlService: ShopProductBacklistUrlService) {}
}
