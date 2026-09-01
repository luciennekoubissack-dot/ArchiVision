import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { TechnologieLayoutService } from './technologie-layout.service';

describe('TechnologieLayoutService', () => {
  let service: TechnologieLayoutService;

  const prismaMock = {
    techComponent: { findMany: jest.fn(), update: jest.fn((a) => a) },
    $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [TechnologieLayoutService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(TechnologieLayoutService);
  });

  it('positionne chaque composant et persiste en une transaction', async () => {
    prismaMock.techComponent.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);

    const result = await service.generateAndPersist('org-1');

    expect(result.count).toBe(3);
    expect(result.elements.map((e) => e.id)).toEqual(['a', 'b', 'c']);
    result.elements.forEach((e) => {
      expect(typeof e.positionX).toBe('number');
      expect(typeof e.positionY).toBe('number');
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.techComponent.update).toHaveBeenCalledTimes(3);
  });

  it('ne persiste rien sans composant', async () => {
    prismaMock.techComponent.findMany.mockResolvedValue([]);
    const result = await service.generateAndPersist('org-1');
    expect(result).toEqual({ elements: [], count: 0 });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
