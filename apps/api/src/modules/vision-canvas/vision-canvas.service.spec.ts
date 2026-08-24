import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { VisionCanvasService } from './vision-canvas.service';

describe('VisionCanvasService', () => {
  let service: VisionCanvasService;
  const ORG_ID = 'org-001';

  const mockCanvas = {
    id: 'canvas-001',
    organisationId: ORG_ID,
    targetGroup: null,
    needs: null,
    product: null,
    businessGoals: null,
    competitors: null,
    revenueStreams: null,
    costFactors: null,
    channels: null,
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    visionCanvas: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [VisionCanvasService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(VisionCanvasService);
  });

  it('crée le canevas vide au premier appel de get()', async () => {
    prismaMock.visionCanvas.upsert.mockResolvedValue(mockCanvas);

    const result = await service.get(ORG_ID);

    expect(result).toEqual(mockCanvas);
    expect(prismaMock.visionCanvas.upsert).toHaveBeenCalledWith({
      where: { organisationId: ORG_ID },
      create: { organisationId: ORG_ID },
      update: {},
    });
  });

  it('met à jour les champs fournis via upsert', async () => {
    prismaMock.visionCanvas.upsert.mockResolvedValue({ ...mockCanvas, targetGroup: 'PME industrielles' });

    const result = await service.update(ORG_ID, { targetGroup: 'PME industrielles' });

    expect(result.targetGroup).toBe('PME industrielles');
    expect(prismaMock.visionCanvas.upsert).toHaveBeenCalledWith({
      where: { organisationId: ORG_ID },
      create: { organisationId: ORG_ID, targetGroup: 'PME industrielles' },
      update: { targetGroup: 'PME industrielles' },
    });
  });
});
