import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UtilsService {
  private readonly logger = new Logger(UtilsService.name);
  isPriceInPriceCheck(euroPrice: number, expectedPrice: number) {
    const tolerance = 0.45;

    this.logger.log({
      euroPrice,
      tolerance,
      expectedPrice,
    });

    const unit = Math.abs(euroPrice - expectedPrice) / expectedPrice;
    const priceInRange = unit <= tolerance;

    this.logger.log(`princeInRange = ${priceInRange}`);

    return priceInRange;
  }
}
