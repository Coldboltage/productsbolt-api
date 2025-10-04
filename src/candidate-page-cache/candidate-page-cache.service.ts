import { Injectable } from '@nestjs/common';
import { CreateCandidatePageCacheDto } from './dto/create-candidate-page-cache.dto';
import { UpdateCandidatePageCacheDto } from './dto/update-candidate-page-cache.dto';

@Injectable()
export class CandidatePageCacheService {
  create(createCandidatePageCacheDto: CreateCandidatePageCacheDto) {
    return 'This action adds a new candidatePageCache';
  }

  findAll() {
    return `This action returns all candidatePageCache`;
  }

  findOne(id: number) {
    return `This action returns a #${id} candidatePageCache`;
  }

  update(id: number, updateCandidatePageCacheDto: UpdateCandidatePageCacheDto) {
    return `This action updates a #${id} candidatePageCache`;
  }

  remove(id: number) {
    return `This action removes a #${id} candidatePageCache`;
  }
}
