import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { ApplicationsLayoutService } from './applications-layout.service';

describe('ApplicationsLayoutService', () => {
  let service: ApplicationsLayoutService;

  const prismaMock = {
    application: { findMany: jest.fn(), update: jest.fn((a) => a) },
    $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApplicationsLayoutService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(ApplicationsLayoutService);
  });

  it('positionne chaque application et persiste en une transaction', async () => {
    prismaMock.application.findMany.mockResolvedValue([{ id: 'x' }, { id: 'y' }]);

    const result = await service.generateAndPersist('org-1');

    expect(result.count).toBe(2);
    result.elements.forEach((e) => {
      expect(typeof e.positionX).toBe('number');
      expect(typeof e.positionY).toBe('number');
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.application.update).toHaveBeenCalledTimes(2);
  });

  it('ne persiste rien sans application', async () => {
    prismaMock.application.findMany.mockResolvedValue([]);
    const result = await service.generateAndPersist('org-1');
    expect(result).toEqual({ elements: [], count: 0 });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
