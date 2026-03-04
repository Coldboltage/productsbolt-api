import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductTools } from './product.tool';
import { BrandModule } from 'src/brand/brand.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), BrandModule],
  controllers: [ProductController],
  providers: [ProductService, ProductTools],
  exports: [ProductService],
})
export class ProductModule {}
