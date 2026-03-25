import { Module } from '@nestjs/common';
import { UrlController } from './url.controller';

@Module({
  controllers: [UrlController],
})
export class UrlModule {}
