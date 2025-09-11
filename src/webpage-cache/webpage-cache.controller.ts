import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { WebpageCacheService } from './webpage-cache.service';
import { CreateWebpageCacheDto } from './dto/create-webpage-cache.dto';
import { UpdateWebpageCacheDto } from './dto/update-webpage-cache.dto';
import { UpdateWebpageDto } from 'src/webpage/dto/update-webpage.dto';

@Controller('webpage-cache')
export class WebpageCacheController {
  constructor(private readonly webpageCacheService: WebpageCacheService) { }

  @Post()
  create(@Body() createWebpageCacheDto: CreateWebpageCacheDto) {
    return this.webpageCacheService.create(createWebpageCacheDto);
  }

  @Post('create-all-from-webpages')
  createAllFromWebpages() {
    return this.webpageCacheService.createAllFromWebpages();
  }

  @Post('create-from-specific-webpage/:webpageId')
  createFromSpecificWebpage(@Param('webpageId') webpageId: string) {
    return this.webpageCacheService.createFromSpecificWebpage(webpageId);
  }

  @Get()
  findAll() {
    return this.webpageCacheService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.webpageCacheService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWebpageCacheDto: UpdateWebpageCacheDto,
  ) {
    return this.webpageCacheService.update(+id, updateWebpageCacheDto);
  }

  @Patch('update-single-page-and-cache/:webpageId')
  updatePageAndCXache(
    @Param('webpageId') webpageId: string,
    @Body() updateWebpageDto: UpdateWebpageDto,
  ) {
    return this.webpageCacheService.updateWebpageAndCache(
      webpageId,
      updateWebpageDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.webpageCacheService.remove(+id);
  }
}
