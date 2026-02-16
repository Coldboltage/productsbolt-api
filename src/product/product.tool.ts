import { Injectable } from '@nestjs/common';
import { ProductService } from './product.service';
import { Tool } from '@rekog/mcp-nest';

@Injectable()
export class ProductTools {
  constructor(private productService: ProductService) {}

  @Tool({
    name: 'Find All Products',
    description:
      'Returns a JSON array with each item repersenting a product for each shop to find',
  })
  async findAllProducts() {
    return this.productService.findAllProductsOnly();
  }
}
