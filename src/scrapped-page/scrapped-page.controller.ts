import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ScrappedPageService } from './scrapped-page.service';
import { CreateScrappedPageDto } from './dto/create-scrapped-page.dto';
import { UpdateScrappedPageDto } from './dto/update-scrapped-page.dto';

@Controller('scrapped-page')
export class ScrappedPageController {
  constructor(private readonly scrappedPageService: ScrappedPageService) {}

  @Post()
  create(@Body() createScrappedPageDto: CreateScrappedPageDto) {
    return this.scrappedPageService.create(createScrappedPageDto);
  }

  @Post('create-from-existing-shop-products')
  createFromExistingShopProducts() {
    return this.scrappedPageService.createFromExistingShopProducts();
  }

  @Get()
  findAll() {
    return this.scrappedPageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scrappedPageService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateScrappedPageDto: UpdateScrappedPageDto,
  ) {
    return this.scrappedPageService.update(+id, updateScrappedPageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scrappedPageService.remove(+id);
  }
}
