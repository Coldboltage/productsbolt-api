import { Injectable } from '@nestjs/common';
import { CreateEbayDto } from './dto/create-ebay.dto';
import { UpdateEbayDto } from './dto/update-ebay.dto';

@Injectable()
export class EbayService {
  create(createEbayDto: CreateEbayDto) {
    return 'This action adds a new ebay';
  }

  findAll() {
    return `This action returns all ebay`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ebay`;
  }

  update(id: number, updateEbayDto: UpdateEbayDto) {
    return `This action updates a #${id} ebay`;
  }

  remove(id: number) {
    return `This action removes a #${id} ebay`;
  }
}
