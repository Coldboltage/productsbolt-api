import { Module } from '@nestjs/common';
import { CandidatePageCacheService } from './candidate-page-cache.service';
import { CandidatePageCacheController } from './candidate-page-cache.controller';

@Module({
  controllers: [CandidatePageCacheController],
  providers: [CandidatePageCacheService],
})
export class CandidatePageCacheModule {}
