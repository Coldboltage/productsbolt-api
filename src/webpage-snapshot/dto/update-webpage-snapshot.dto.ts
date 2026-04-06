import { PartialType } from '@nestjs/mapped-types';
import { CreateWebpageSnapshotDto } from './create-webpage-snapshot.dto';

export class UpdateWebpageSnapshotDto extends PartialType(CreateWebpageSnapshotDto) {}
