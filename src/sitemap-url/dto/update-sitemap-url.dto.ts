import { PartialType } from '@nestjs/mapped-types';
import { CreateSitemapUrlDto } from './create-sitemap-url.dto';

export class UpdateSitemapUrlDto extends PartialType(CreateSitemapUrlDto) {}
