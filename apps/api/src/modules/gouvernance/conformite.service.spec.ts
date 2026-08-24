import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { ConformiteService } from './conformite.service';

describe('ConformiteService', () => {
  let service: ConformiteService;
  const ORG_ID = 'org-001';
  const SOLUTION_ID = 'solution-001';

  const prismaMock = {
    solution: { count: jest.fn() },
    politiqueGouvernance: { count: jest.fn() },
    conformiteSolution: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConformiteService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(ConformiteService);
  });

  it('liste toutes les conformités de l\'organisation', async () => {
    prismaMock.conformiteSolution.findMany.mockResolvedValue([]);
    const result = await service.findAll(ORG_ID);
    expect(result).toEqual([]);
    expect(prismaMock.conformiteSolution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { solution: { organisationId: ORG_ID } } }),
    );
  });

  describe('updateConformites', () => {
    const items = [{ politiqueId: '11111111-1111-4111-8111-111111111111', statut: 'CONFORME' as const }];

    it('upsert les conformités puis retourne la matrice à jour de la solution', async () => {
      prismaMock.solution.count.mockResolvedValue(1);
      prismaMock.politiqueGouvernance.count.mockResolvedValue(1);
      prismaMock.conformiteSolution.findMany.mockResolvedValue([{ ...items[0], solutionId: SOLUTION_ID }]);

      const result = await service.updateConformites(SOLUTION_ID, ORG_ID, items);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.conformiteSolution.upsert).toHaveBeenCalledWith({
        where: { solutionId_politiqueId: { solutionId: SOLUTION_ID, politiqueId: items[0].politiqueId } },
        create: { solutionId: SOLUTION_ID, politiqueId: items[0].politiqueId, statut: 'CONFORME', commentaire: undefined },
        update: { statut: 'CONFORME', commentaire: undefined },
      });
      expect(result).toHaveLength(1);
    });

    it('lève NotFoundException si la solution est introuvable', async () => {
      prismaMock.solution.count.mockResolvedValue(0);
      await expect(service.updateConformites('inconnu', ORG_ID, items)).rejects.toThrow(NotFoundException);
    });

    it('lève NotFoundException si une politique appartient à une autre organisation', async () => {
      prismaMock.solution.count.mockResolvedValue(1);
      prismaMock.politiqueGouvernance.count.mockResolvedValue(0);
      await expect(service.updateConformites(SOLUTION_ID, ORG_ID, items)).rejects.toThrow(NotFoundException);
    });
  });
});
