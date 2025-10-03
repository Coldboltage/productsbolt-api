import { Injectable } from '@nestjs/common';
import { CreateScrappedPageDto } from './dto/create-scrapped-page.dto';
import { UpdateScrappedPageDto } from './dto/update-scrapped-page.dto';

@Injectable()
export class ScrappedPageService {
  create(createScrappedPageDto: CreateScrappedPageDto) {
    return 'This action adds a new scrappedPage';
  }

  findAll() {
    return `This action returns all scrappedPage`;
  }

  findOne(id: number) {
    return `This action returns a #${id} scrappedPage`;
  }

  update(id: number, updateScrappedPageDto: UpdateScrappedPageDto) {
    return `This action updates a #${id} scrappedPage`;
  }

  remove(id: number) {
    return `This action removes a #${id} scrappedPage`;
  }
}
