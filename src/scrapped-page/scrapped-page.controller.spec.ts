import { Test, TestingModule } from '@nestjs/testing';
import { ScrappedPageController } from './scrapped-page.controller';
import { ScrappedPageService } from './scrapped-page.service';

describe('ScrappedPageController', () => {
  let controller: ScrappedPageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScrappedPageController],
      providers: [ScrappedPageService],
    }).compile();

    controller = module.get<ScrappedPageController>(ScrappedPageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
