import { Injectable } from '@nestjs/common';
import { CreateEbayStatDto } from './dto/create-ebay-stat.dto';
import { UpdateEbayStatDto } from './dto/update-ebay-stat.dto';

@Injectable()
export class EbayStatsService {
  create(createEbayStatDto: CreateEbayStatDto) {
    return 'This action adds a new ebayStat';
  }

  findAll() {
    return `This action returns all ebayStats`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ebayStat`;
  }

  update(id: number, updateEbayStatDto: UpdateEbayStatDto) {
    return `This action updates a #${id} ebayStat`;
  }

  remove(id: number) {
    return `This action removes a #${id} ebayStat`;
  }
}
