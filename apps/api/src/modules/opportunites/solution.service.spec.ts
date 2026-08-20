import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { SolutionService } from './solution.service';

describe('SolutionService', () => {
  let service: SolutionService;
  const ORG_ID = 'org-001';
  const AUTRE_ORG_ID = 'org-002';

  const mockSolution = {
    id: 'solution-001',
    nom: 'Migrer vers un ERP cloud',
    description: null,
    statut: 'PROPOSEE',
    planMiseOeuvre: null,
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    solution: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    critereEvaluation: {
      count: jest.fn(),
    },
    evaluationScore: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [SolutionService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(SolutionService);
  });

  it('crée une solution rattachée à l\'organisation', async () => {
    prismaMock.solution.create.mockResolvedValue(mockSolution);

    const result = await service.create(ORG_ID, { nom: mockSolution.nom });

    expect(result).toEqual(mockSolution);
    expect(prismaMock.solution.create).toHaveBeenCalledWith({
      data: { nom: mockSolution.nom, organisationId: ORG_ID },
    });
  });

  it('liste les solutions d\'une organisation avec leurs notes', async () => {
    prismaMock.solution.findMany.mockResolvedValue([mockSolution]);

    const result = await service.findAll(ORG_ID);

    expect(result).toEqual([mockSolution]);
    expect(prismaMock.solution.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organisationId: ORG_ID }, include: { scores: true } }),
    );
  });

  it('lève NotFoundException si la solution appartient à une autre organisation', async () => {
    prismaMock.solution.findUnique.mockResolvedValue(mockSolution);

    await expect(service.findOne(mockSolution.id, AUTRE_ORG_ID)).rejects.toThrow(NotFoundException);
  });

  it('met à jour une solution existante', async () => {
    prismaMock.solution.count.mockResolvedValue(1);
    prismaMock.solution.update.mockResolvedValue({ ...mockSolution, statut: 'RETENUE' });

    const result = await service.update(mockSolution.id, ORG_ID, { statut: 'RETENUE' as never });

    expect(result.statut).toBe('RETENUE');
  });

  it('supprime une solution existante', async () => {
    prismaMock.solution.count.mockResolvedValue(1);
    prismaMock.solution.delete.mockResolvedValue(mockSolution);

    await service.remove(mockSolution.id, ORG_ID);

    expect(prismaMock.solution.delete).toHaveBeenCalledWith({ where: { id: mockSolution.id } });
  });

  it('lève NotFoundException lors de la suppression d\'une solution inconnue', async () => {
    prismaMock.solution.count.mockResolvedValue(0);

    await expect(service.remove('inconnu', ORG_ID)).rejects.toThrow(NotFoundException);
  });

  describe('updateScores', () => {
    const items = [{ critereId: 'critere-001', score: 4 }];

    it('upsert les notes puis retourne la solution à jour', async () => {
      prismaMock.solution.count.mockResolvedValue(1);
      prismaMock.critereEvaluation.count.mockResolvedValue(1);
      prismaMock.solution.findUnique.mockResolvedValue({ ...mockSolution, scores: [] });

      const result = await service.updateScores(mockSolution.id, ORG_ID, items);

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(prismaMock.evaluationScore.upsert).toHaveBeenCalledWith({
        where: { solutionId_critereId: { solutionId: mockSolution.id, critereId: 'critere-001' } },
        create: { solutionId: mockSolution.id, critereId: 'critere-001', score: 4, commentaire: undefined },
        update: { score: 4, commentaire: undefined },
      });
      expect(result).toEqual({ ...mockSolution, scores: [] });
    });

    it('lève NotFoundException si la solution est introuvable', async () => {
      prismaMock.solution.count.mockResolvedValue(0);

      await expect(service.updateScores('inconnu', ORG_ID, items)).rejects.toThrow(NotFoundException);
    });

    it('lève NotFoundException si un critère appartient à une autre organisation', async () => {
      prismaMock.solution.count.mockResolvedValue(1);
      prismaMock.critereEvaluation.count.mockResolvedValue(0);

      await expect(service.updateScores(mockSolution.id, ORG_ID, items)).rejects.toThrow(NotFoundException);
    });
  });
});
