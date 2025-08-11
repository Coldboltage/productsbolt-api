import { ConflictException, Injectable } from '@nestjs/common';
import { CreateSitemapDto } from './dto/create-sitemap.dto';
import { UpdateSitemapDto } from './dto/update-sitemap.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Sitemap } from './entities/sitemap.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SitemapService {
  constructor(
    @InjectRepository(Sitemap) private sitemapRepository: Repository<Sitemap>,
  ) { }
  async create(createSitemapDto: CreateSitemapDto) {
    const sitemapExist = await this.sitemapRepository.exists({
      where: {
        shop: {
          id: createSitemapDto.shopId,
        },
      },
    });
    if (sitemapExist) {
      throw new ConflictException('sitemap_already_exists_for_shop');
    }

    return this.sitemapRepository.save(createSitemapDto);
  }

  findAll() {
    return `This action returns all sitemap`;
  }

  async findOne(id: string) {
    return this.sitemapRepository.findOne({
      where: {
        id,
      },
      relations: {
        shop: true,
      },
    });
  }

  update(id: string, updateSitemapDto: UpdateSitemapDto) {
    return this.sitemapRepository.update(id, updateSitemapDto);
  }

  remove(id: number) {
    return `This action removes a #${id} sitemap`;
  }
}
