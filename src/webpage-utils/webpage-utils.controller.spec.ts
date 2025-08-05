import { Test, TestingModule } from '@nestjs/testing';
import { WebpageUtilsController } from './webpage-utils.controller';
import { WebpageUtilsService } from './webpage-utils.service';

describe('WebpageUtilsController', () => {
  let controller: WebpageUtilsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebpageUtilsController],
      providers: [WebpageUtilsService],
    }).compile();

    controller = module.get<WebpageUtilsController>(WebpageUtilsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
