import { ConflictException, Injectable } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand) private brandRepository: Repository<Brand>,
  ) {}
  async create(createBrandDto: CreateBrandDto) {
    const brandEntity = await this.brandRepository.save(createBrandDto);
    if (!brandEntity) throw new ConflictException('brand_already_exists');
    return brandEntity;
  }

  findAll() {
    return this.brandRepository.find();
  }

  findOne(id: string) {
    return this.brandRepository.findOne({
      where: {
        id,
      },
    });
  }

  findOneByUrlSafeName(urlSafeName: string) {
    return this.brandRepository.findOne({
      where: {
        urlSafeName,
      },
    });
  }

  update(id: string, updateBrandDto: UpdateBrandDto) {
    return this.brandRepository.update(id, updateBrandDto);
  }

  async remove(id: string) {
    const brandEntity = await this.findOne(id);
    return this.brandRepository.remove(brandEntity);
  }
}
