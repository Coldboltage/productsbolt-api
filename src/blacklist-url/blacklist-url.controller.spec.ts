import { Test, TestingModule } from '@nestjs/testing';
import { BlackListUrlController } from './blacklist-url.controller';
import { BlackListUrlService } from './blacklist-url.service';

describe('BlackListUrlController', () => {
  let controller: BlackListUrlController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlackListUrlController],
      providers: [BlackListUrlService],
    }).compile();

    controller = module.get<BlackListUrlController>(BlackListUrlController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
