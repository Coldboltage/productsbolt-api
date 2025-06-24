import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BlackListUrlService } from './blacklist-url.service';
import { CreateBlackListUrlDto } from './dto/create-blacklist-url.dto';
import { UpdateBlackListUrlDto } from './dto/update-blacklist-url.dto';

@Controller('blacklist-url')
export class BlackListUrlController {
  constructor(private readonly BlackListUrlService: BlackListUrlService) { }

  @Post()
  create(@Body() createBlackListUrlDto: CreateBlackListUrlDto) {
    return this.BlackListUrlService.create(createBlackListUrlDto);
  }

  @Get()
  findAll() {
    return this.BlackListUrlService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.BlackListUrlService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBlackListUrlDto: UpdateBlackListUrlDto,
  ) {
    return this.BlackListUrlService.update(+id, updateBlackListUrlDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.BlackListUrlService.remove(+id);
  }
}
