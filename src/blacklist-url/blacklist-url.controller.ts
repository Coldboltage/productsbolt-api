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
import { BlackListUrl } from './entities/blacklist-url.entity';
import { DeleteResult, UpdateResult } from 'typeorm';

@Controller('blacklist-url')
export class BlackListUrlController {
  constructor(private readonly BlackListUrlService: BlackListUrlService) {}

  // Duel function. It will create a new unique Blacklist URL or it'll find that a URL already exits and append itself.
  @Post()
  async create(
    @Body() createBlackListUrlDto: CreateBlackListUrlDto,
  ): Promise<BlackListUrl> {
    return this.BlackListUrlService.create(createBlackListUrlDto);
  }

  // Finds all Blacklist Urls
  @Get()
  async findAll(): Promise<BlackListUrl[]> {
    return this.BlackListUrlService.findAll();
  }

  // Finds a specific Blacklist Url
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BlackListUrl> {
    return this.BlackListUrlService.findOne(id);
  }

  // Update a Blacklist URL
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBlackListUrlDto: UpdateBlackListUrlDto,
  ): Promise<UpdateResult> {
    return this.BlackListUrlService.update(id, updateBlackListUrlDto);
  }

  // Removes a Blacklist URL. This allows the URL to be allowed for certain products again
  @Delete(':id')
  remove(@Param('id') id: string): Promise<DeleteResult> {
    return this.BlackListUrlService.remove(id);
  }
}
