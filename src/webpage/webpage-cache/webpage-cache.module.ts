import { Module } from '@nestjs/common';
import { WebpageCacheService } from './webpage-cache.service';
import { WebpageCacheController } from './webpage-cache.controller';

@Module({
  controllers: [WebpageCacheController],
  providers: [WebpageCacheService],
})
export class WebpageCacheModule {}
