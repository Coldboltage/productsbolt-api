import { Injectable } from '@nestjs/common';
import { CreateCandidatePageCacheDto } from './dto/create-candidate-page-cache.dto';
import { UpdateCandidatePageCacheDto } from './dto/update-candidate-page-cache.dto';
import { CandidatePageService } from 'src/candidate-page/candidate-page.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidatePageCache } from './entities/candidate-page-cache.entity';
import { CreateCandidatePageWithIdDto } from 'src/candidate-page/dto/create-candidate-page-with-id';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class CandidatePageCacheService {
  constructor(
    @InjectRepository(CandidatePageCache)
    private candidatePageCacheRepository: Repository<CandidatePageCache>,
    private candidatePageService: CandidatePageService,
  ) {}
  create(createCandidatePageCacheDto: CreateCandidatePageCacheDto) {
    return 'This action adds a new candidatePageCache';
  }

  async findAll(): Promise<CandidatePageCache[]> {
    return this.candidatePageCacheRepository.find({});
  }

  async findOne(id: string) {
    return this.candidatePageCacheRepository.findOne({
      where: { id },
    });
  }

  update(id: number, updateCandidatePageCacheDto: UpdateCandidatePageCacheDto) {
    return `This action updates a #${id} candidatePageCache`;
  }

  remove(id: number) {
    return `This action removes a #${id} candidatePageCache`;
  }

  @OnEvent('candidatePage.foundExisting')
  async updateWebpageAndCache(
    createCandidatePageWithIdDto: CreateCandidatePageWithIdDto,
  ) {
    console.log('updateWebpageAndCache called');

    // We're going to get the answer. If the answer is the same as before, we're going to add count++. If this becomes over 5+, then it'll be considered confirmed

    const candidateWebpageEntity = await this.candidatePageService.findOne(
      createCandidatePageWithIdDto.id,
    );
    let count = createCandidatePageWithIdDto.count;

    console.log(count);

    candidateWebpageEntity.candidatePageCache.date = new Date();

    if (
      candidateWebpageEntity.inStock === createCandidatePageWithIdDto.inStock &&
      +candidateWebpageEntity.price === createCandidatePageWithIdDto.price &&
      candidateWebpageEntity.candidatePageCache.hash ===
        createCandidatePageWithIdDto.hash &&
      !createCandidatePageWithIdDto.shopifySite
    ) {
      console.log('count if activated');
      count++;
    }
    // if scenarios
    // 1) if hash is different, reset
    // 2) if hash is the same - count is below 3, still not enough confirmations
    // 3) If hass is the same - count is above 4,
    if (createCandidatePageWithIdDto.shopifySite) {
      candidateWebpageEntity.candidatePageCache.count = 0;
      candidateWebpageEntity.candidatePageCache.confirmed = false;
    } else if (
      candidateWebpageEntity.candidatePageCache.hash !==
      createCandidatePageWithIdDto.hash
    ) {
      console.log('if 1 activated');
      console.log(createCandidatePageWithIdDto.hash);
      candidateWebpageEntity.candidatePageCache.hash =
        createCandidatePageWithIdDto.hash;
      candidateWebpageEntity.candidatePageCache.count = 1;
      candidateWebpageEntity.candidatePageCache.confirmed = false;
    } else if (
      candidateWebpageEntity.candidatePageCache.hash ===
        createCandidatePageWithIdDto.hash &&
      candidateWebpageEntity.candidatePageCache.count < 5
    ) {
      console.log('if 2 activated');
      candidateWebpageEntity.candidatePageCache.count = count;
    } else if (
      candidateWebpageEntity.candidatePageCache.hash ===
        createCandidatePageWithIdDto.hash &&
      count >= 4 &&
      !candidateWebpageEntity.candidatePageCache.confirmed
    ) {
      console.log('if 3 activated');
      candidateWebpageEntity.candidatePageCache.confirmed = true;
    }

    // The Webpage will update as per normal
    await this.candidatePageCacheRepository.save(
      candidateWebpageEntity.candidatePageCache,
    );
    // await this.candidatePageService.update(candidateWebpageEntity.id, {
    //   ...createCandidatePageWithIdDto,
    // });
  }
}
