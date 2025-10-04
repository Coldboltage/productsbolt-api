import { Module } from '@nestjs/common';
import { CandidatePageService } from './candidate-page.service';
import { CandidatePageController } from './candidate-page.controller';

@Module({
  controllers: [CandidatePageController],
  providers: [CandidatePageService],
})
export class CandidatePageModule {}
