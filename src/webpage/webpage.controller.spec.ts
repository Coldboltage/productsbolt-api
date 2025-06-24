import { Test, TestingModule } from '@nestjs/testing';
import { WebpageController } from './webpage.controller';
import { WebpageService } from './webpage.service';

describe('WebpageController', () => {
  let controller: WebpageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebpageController],
      providers: [WebpageService],
    }).compile();

    controller = module.get<WebpageController>(WebpageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
