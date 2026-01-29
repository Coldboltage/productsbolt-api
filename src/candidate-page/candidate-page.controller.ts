import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CandidatePageService } from './candidate-page.service';
import { CreateCandidatePageDto } from './dto/create-candidate-page.dto';
import { UpdateCandidatePageDto } from './dto/update-candidate-page.dto';
import { CandidatePage } from './entities/candidate-page.entity';

@Controller('candidate-page')
export class CandidatePageController {
  constructor(private readonly candidatePageService: CandidatePageService) {}

  @Post()
  create(
    @Body() createCandidatePageDto: CreateCandidatePageDto,
  ): Promise<CandidatePage> {
    return this.candidatePageService.create(createCandidatePageDto);
  }

  @Post('check-page/:id')
  checkPage(@Param('id') id: string) {
    return this.candidatePageService.checkPage(id);
  }

  @Get('find-all-price-match-edition-match')
  findAllPriceMatchEditionMatch() {
    return this.candidatePageService.findAllPriceMatchEditionMatch();
  }

  @Get()
  findAll() {
    return this.candidatePageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<CandidatePage> {
    return this.candidatePageService.findOne(id);
  }

  @Patch('updated-inspected/:id')
  updatedInspected(@Param('id') id: string) {
    return this.candidatePageService.updateInspected(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCandidatePageDto: UpdateCandidatePageDto,
  ) {
    return this.candidatePageService.update(id, updateCandidatePageDto);
  }

  @Delete('remove-shop-product-null')
  removeShopProductNull() {
    return this.candidatePageService.removeNull();
  }

  @Delete('create-webpage-delete-candidate-page/:id')
  createWebpageRemoveCandidatePage(@Param('id') id: string) {
    return this.candidatePageService.createWebpageRemoveCandidatePage(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.candidatePageService.remove(id);
  }
}
