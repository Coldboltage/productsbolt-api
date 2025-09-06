import { Module } from '@nestjs/common';
import { WebpageCacheService } from './webpage-cache.service';
import { WebpageCacheController } from './webpage-cache.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebpageCache } from './entities/webpage-cache.entity';
import { WebpageModule } from '../webpage/webpage.module';
import { Webpage } from '../webpage/entities/webpage.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebpageCache]), 
    WebpageModule
  ],
  controllers: [WebpageCacheController],
  providers: [WebpageCacheService],
})
export class WebpageCacheModule {}
