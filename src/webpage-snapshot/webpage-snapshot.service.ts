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
  async create(createWebpageSnapshotDto: CreateWebpageSnapshotDto) {
    return this.webpageSnapshotRepository.save({
      ...createWebpageSnapshotDto,
      webpage: { id: createWebpageSnapshotDto.webpageId },
    });
  }

  async findAll() {
    return this.webpageSnapshotRepository.find({});
  }

  async findAllByWebpageId(webpageId: string) {
    return this.webpageSnapshotRepository.find({
      where: {
        webpage: {
          id: webpageId,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findAllByProductId(productId: string) {
    return this.webpageSnapshotRepository.find({
      where: {
        webpage: {
          shopProduct: {
            product: {
              id: productId,
            },
          },
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findAllByProductIdRelations(productId: string) {
    return this.webpageSnapshotRepository.find({
      where: {
        webpage: {
          shopProduct: {
            product: {
              id: productId,
            },
          },
        },
      },
      relations: {
        webpage: {
          shopProduct: {
            product: true,
          },
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string) {
    return this.webpageSnapshotRepository.findOne({ where: { id } });
  }

  async update(id: string, updateWebpageSnapshotDto: UpdateWebpageSnapshotDto) {
    return this.webpageSnapshotRepository.update(id, updateWebpageSnapshotDto);
  }

  async remove(id: string) {
    const snapshotEntity = await this.findOne(id);
    return this.webpageSnapshotRepository.remove(snapshotEntity);
  }
}
