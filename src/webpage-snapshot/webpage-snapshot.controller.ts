import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { WebpageSnapshotService } from './webpage-snapshot.service';
import { CreateWebpageSnapshotDto } from './dto/create-webpage-snapshot.dto';
import { UpdateWebpageSnapshotDto } from './dto/update-webpage-snapshot.dto';

@Controller('webpage-snapshot')
export class WebpageSnapshotController {
  constructor(
    private readonly webpageSnapshotService: WebpageSnapshotService,
  ) {}

  @Post()
  create(@Body() createWebpageSnapshotDto: CreateWebpageSnapshotDto) {
    return this.webpageSnapshotService.create(createWebpageSnapshotDto);
  }

  @Get()
  findAll() {
    return this.webpageSnapshotService.findAll();
  }

  @Get('find-all-by-webpage-id/:id')
  findAllByWebpageId(@Param('id') id: string) {
    return this.webpageSnapshotService.findAllByWebpageId(id);
  }

  @Get('find-all-by-product-id/:id')
  findAllByProductId(@Param('id') id: string) {
    return this.webpageSnapshotService.findAllByProductId(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.webpageSnapshotService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWebpageSnapshotDto: UpdateWebpageSnapshotDto,
  ) {
    return this.webpageSnapshotService.update(id, updateWebpageSnapshotDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.webpageSnapshotService.remove(id);
  }
}
