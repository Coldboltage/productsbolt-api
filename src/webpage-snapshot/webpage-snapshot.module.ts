import { Module } from '@nestjs/common';
import { WebpageSnapshotService } from './webpage-snapshot.service';
import { WebpageSnapshotController } from './webpage-snapshot.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebpageSnapshot } from './entities/webpage-snapshot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WebpageSnapshot])],
  controllers: [WebpageSnapshotController],
  providers: [WebpageSnapshotService],
  exports: [WebpageSnapshotService],
})
export class WebpageSnapshotModule {}
