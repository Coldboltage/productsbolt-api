import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CandidatePageCacheService } from './candidate-page-cache.service';
import { CreateCandidatePageCacheDto } from './dto/create-candidate-page-cache.dto';
import { UpdateCandidatePageCacheDto } from './dto/update-candidate-page-cache.dto';

@Controller('candidate-page-cache')
export class CandidatePageCacheController {
  constructor(
    private readonly candidatePageCacheService: CandidatePageCacheService,
  ) {}

  @Post()
  create(@Body() createCandidatePageCacheDto: CreateCandidatePageCacheDto) {
    return this.candidatePageCacheService.create(createCandidatePageCacheDto);
  }

  @Get()
  findAll() {
    return this.candidatePageCacheService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.candidatePageCacheService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCandidatePageCacheDto: UpdateCandidatePageCacheDto,
  ) {
    return this.candidatePageCacheService.update(
      +id,
      updateCandidatePageCacheDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.candidatePageCacheService.remove(+id);
  }
}
