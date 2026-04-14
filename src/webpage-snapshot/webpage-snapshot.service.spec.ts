import { Test, TestingModule } from '@nestjs/testing';
import { WebpageSnapshotService } from './webpage-snapshot.service';

describe('WebpageSnapshotService', () => {
  let service: WebpageSnapshotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebpageSnapshotService],
    }).compile();

    service = module.get<WebpageSnapshotService>(WebpageSnapshotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
