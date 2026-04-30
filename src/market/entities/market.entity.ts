import { SnapshotSlim } from 'src/webpage-snapshot/entities/webpage-snapshot.entity';
import { StrippedWebpageSlimWithShopMinimal } from '../../webpage/entities/webpage.entity';

export class Market {}

export interface MarketPayload {
  productName: string;
  webpages: StrippedWebpageSlimWithShopMinimal[];
  snapshots: SnapshotSlim[];
}
