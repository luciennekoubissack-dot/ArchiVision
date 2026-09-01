import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { DonneesLayoutService } from './donnees-layout.service';

describe('DonneesLayoutService', () => {
  let service: DonneesLayoutService;

  const prismaMock = {
    dataEntity: { findMany: jest.fn(), update: jest.fn((args) => args) },
    dataRelation: { findMany: jest.fn(), create: jest.fn((args) => args) },
    $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [DonneesLayoutService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(DonneesLayoutService);
  });

  it('positionne toutes les entités et déduit les relations FK manquantes', async () => {
    prismaMock.dataEntity.findMany.mockResolvedValue([
      { id: 'c', nom: 'Client', attributs: [] },
      { id: 'o', nom: 'Commande', attributs: [{ nom: 'clientId' }] },
    ]);
    prismaMock.dataRelation.findMany.mockResolvedValue([]);

    const result = await service.generateAndPersist('org-1');

    expect(result.count).toBe(2);
    expect(result.relationsInfereesCount).toBe(1);
    expect(result.elements).toHaveLength(2);
    for (const el of result.elements) {
      expect(typeof el.positionX).toBe('number');
      expect(typeof el.positionY).toBe('number');
    }
    // une seule transaction : 2 updates + 1 create
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.dataEntity.update).toHaveBeenCalledTimes(2);
    expect(prismaMock.dataRelation.create).toHaveBeenCalledTimes(1);
  });

  it('ne persiste rien si aucune entité', async () => {
    prismaMock.dataEntity.findMany.mockResolvedValue([]);

    const result = await service.generateAndPersist('org-1');

    expect(result).toEqual({ elements: [], count: 0, relationsInfereesCount: 0 });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('ne déduit pas de relation déjà existante', async () => {
    prismaMock.dataEntity.findMany.mockResolvedValue([
      { id: 'c', nom: 'Client', attributs: [] },
      { id: 'o', nom: 'Commande', attributs: [{ nom: 'clientId' }] },
    ]);
    prismaMock.dataRelation.findMany.mockResolvedValue([{ sourceId: 'o', targetId: 'c' }]);

    const result = await service.generateAndPersist('org-1');

    expect(result.relationsInfereesCount).toBe(0);
    expect(prismaMock.dataRelation.create).not.toHaveBeenCalled();
  });
});
