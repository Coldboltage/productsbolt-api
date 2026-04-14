import { Test, TestingModule } from '@nestjs/testing';
import { WebpageSnapshotController } from './webpage-snapshot.controller';
import { WebpageSnapshotService } from './webpage-snapshot.service';

describe('WebpageSnapshotController', () => {
  let controller: WebpageSnapshotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebpageSnapshotController],
      providers: [WebpageSnapshotService],
    }).compile();

    controller = module.get<WebpageSnapshotController>(WebpageSnapshotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
