import { Injectable } from '@nestjs/common';
import { CreateWebpageSnapshotDto } from './dto/create-webpage-snapshot.dto';
import { UpdateWebpageSnapshotDto } from './dto/update-webpage-snapshot.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { WebpageSnapshot } from './entities/webpage-snapshot.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WebpageSnapshotService {
  constructor(
    @InjectRepository(WebpageSnapshot)
    private webpageSnapshotRepository: Repository<WebpageSnapshot>,
  ) {}
  create(createWebpageSnapshotDto: CreateWebpageSnapshotDto) {
    return this.webpageSnapshotRepository.save({
      ...createWebpageSnapshotDto,
      webpage: { id: createWebpageSnapshotDto.webpageId },
    });
  }

  findAll() {
    return `This action returns all webpageSnapshot`;
  }

  findOne(id: number) {
    return `This action returns a #${id} webpageSnapshot`;
  }

  update(id: number, updateWebpageSnapshotDto: UpdateWebpageSnapshotDto) {
    return `This action updates a #${id} webpageSnapshot`;
  }

  remove(id: number) {
    return `This action removes a #${id} webpageSnapshot`;
  }
}
