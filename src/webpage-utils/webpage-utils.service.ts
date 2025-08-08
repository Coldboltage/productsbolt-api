import { Injectable } from '@nestjs/common';
import { CreateWebpageUtilDto } from './dto/create-webpage-util.dto';
import { UpdateWebpageUtilDto } from './dto/update-webpage-util.dto';
import { Repository } from 'typeorm';
import { Webpage } from '../webpage/entities/webpage.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class WebpageUtilsService {
  constructor(
    @InjectRepository(Webpage) private webpageRepository: Repository<Webpage>,
  ) { }
  create(createWebpageUtilDto: CreateWebpageUtilDto) {
    return 'This action adds a new webpageUtil';
  }

  findAll() {
    return this.webpageRepository.find({
      relations: {
        shopProduct: {
          product: true,
          shop: true,
        }
      }
    });
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
