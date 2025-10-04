import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CandidatePageService } from './candidate-page.service';
import { CreateCandidatePageDto } from './dto/create-candidate-page.dto';
import { UpdateCandidatePageDto } from './dto/update-candidate-page.dto';

@Controller('candidate-page')
export class CandidatePageController {
  constructor(private readonly candidatePageService: CandidatePageService) {}

  @Post()
  create(@Body() createCandidatePageDto: CreateCandidatePageDto) {
    return this.candidatePageService.create(createCandidatePageDto);
  }

  @Get()
  findAll() {
    return this.candidatePageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.candidatePageService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCandidatePageDto: UpdateCandidatePageDto) {
    return this.candidatePageService.update(+id, updateCandidatePageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.candidatePageService.remove(+id);
  }
}
