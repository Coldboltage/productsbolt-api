import { Controller, Patch } from '@nestjs/common';
import { UrlService } from './url.service';

@Controller('url')
export class UrlController {
  constructor(private urlService: UrlService) {}

  @Patch('populate-urls')
  populatedUrls() {
    this.urlService.populateUrls();
  }
}
