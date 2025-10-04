import { Injectable } from '@nestjs/common';
import { CreateCandidatePageDto } from './dto/create-candidate-page.dto';
import { UpdateCandidatePageDto } from './dto/update-candidate-page.dto';

@Injectable()
export class CandidatePageService {
  create(createCandidatePageDto: CreateCandidatePageDto) {
    return 'This action adds a new candidatePage';
  }

  findAll() {
    return `This action returns all candidatePage`;
  }

  findOne(id: number) {
    return `This action returns a #${id} candidatePage`;
  }

  update(id: number, updateCandidatePageDto: UpdateCandidatePageDto) {
    return `This action updates a #${id} candidatePage`;
  }

  remove(id: number) {
    return `This action removes a #${id} candidatePage`;
  }
}
