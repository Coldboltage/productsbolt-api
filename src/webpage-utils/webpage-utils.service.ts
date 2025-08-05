import { Injectable } from '@nestjs/common';
import { CreateWebpageUtilDto } from './dto/create-webpage-util.dto';
import { UpdateWebpageUtilDto } from './dto/update-webpage-util.dto';

@Injectable()
export class WebpageUtilsService {
  create(createWebpageUtilDto: CreateWebpageUtilDto) {
    return 'This action adds a new webpageUtil';
  }

  findAll() {
    return `This action returns all webpageUtils`;
  }

  findOne(id: number) {
    return `This action returns a #${id} webpageUtil`;
  }

  update(id: number, updateWebpageUtilDto: UpdateWebpageUtilDto) {
    return `This action updates a #${id} webpageUtil`;
  }

  remove(id: number) {
    return `This action removes a #${id} webpageUtil`;
  }
}
