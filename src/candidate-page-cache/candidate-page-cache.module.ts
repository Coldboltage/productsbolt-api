import { Module } from '@nestjs/common';
import { CandidatePageCacheService } from './candidate-page-cache.service';
import { CandidatePageCacheController } from './candidate-page-cache.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatePageCache } from './entities/candidate-page-cache.entity';
import { CandidatePageModule } from 'src/candidate-page/candidate-page.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CandidatePageCache]),
    CandidatePageModule,
  ],
  controllers: [CandidatePageCacheController],
  providers: [CandidatePageCacheService],
})
export class CandidatePageCacheModule {}
