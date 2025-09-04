import { Injectable } from '@nestjs/common';
import { CreateWebpageCacheDto } from './dto/create-webpage-cache.dto';
import { UpdateWebpageCacheDto } from './dto/update-webpage-cache.dto';

@Injectable()
export class WebpageCacheService {
  create(createWebpageCacheDto: CreateWebpageCacheDto) {
    return 'This action adds a new webpageCache';
  }

  findAll() {
    return `This action returns all webpageCache`;
  }

  findOne(id: number) {
    return `This action returns a #${id} webpageCache`;
  }

  update(id: number, updateWebpageCacheDto: UpdateWebpageCacheDto) {
    return `This action updates a #${id} webpageCache`;
  }

  remove(id: number) {
    return `This action removes a #${id} webpageCache`;
  }
}
