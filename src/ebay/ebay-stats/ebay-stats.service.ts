import { Injectable } from '@nestjs/common';
import { CreateEbayStatDto } from './dto/create-ebay-stat.dto';
import { UpdateEbayStatDto } from './dto/update-ebay-stat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EbayStat } from './entities/ebay-stat.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EbayStatsService {
  constructor(
    @InjectRepository(EbayStat)
    private ebayStatRepository: Repository<EbayStat>,
  ) { }
  create(createEbayStatDto: CreateEbayStatDto) {
    return 'This action adds a new ebayStat';
  }

  findAll() {
    return `This action returns all ebayStats`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ebayStat`;
  }

  async update(id: string, updateEbayStatDto: UpdateEbayStatDto) {
    return `This action updates a #${id} ebayStat`;
  }

  remove(id: number) {
    return `This action removes a #${id} ebayStat`;
  }
}
