import { PartialType } from '@nestjs/mapped-types';
import { CreateScrappedPageDto } from './create-scrapped-page.dto';

export class UpdateScrappedPageDto extends PartialType(CreateScrappedPageDto) {}
