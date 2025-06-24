import { PartialType } from '@nestjs/mapped-types';
import { CreateBlackListUrlDto } from './create-blacklist-url.dto';

export class UpdateBlackListUrlDto extends PartialType(CreateBlackListUrlDto) { }
