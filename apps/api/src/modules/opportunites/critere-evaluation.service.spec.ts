import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { CritereEvaluationService } from './critere-evaluation.service';

describe('CritereEvaluationService', () => {
  let service: CritereEvaluationService;
  const ORG_ID = 'org-001';

  const mockCritere = {
    id: 'critere-001',
    nom: 'Coût',
    description: null,
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    critereEvaluation: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CritereEvaluationService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(CritereEvaluationService);
  });

  it('crée un critère rattaché à l\'organisation', async () => {
    prismaMock.critereEvaluation.create.mockResolvedValue(mockCritere);

    const result = await service.create(ORG_ID, { nom: mockCritere.nom });

    expect(result).toEqual(mockCritere);
    expect(prismaMock.critereEvaluation.create).toHaveBeenCalledWith({
      data: { nom: mockCritere.nom, organisationId: ORG_ID },
    });
  });

  it('liste les critères d\'une organisation', async () => {
    prismaMock.critereEvaluation.findMany.mockResolvedValue([mockCritere]);

    const result = await service.findAll(ORG_ID);

    expect(result).toEqual([mockCritere]);
  });

  it('supprime un critère existant', async () => {
    prismaMock.critereEvaluation.count.mockResolvedValue(1);
    prismaMock.critereEvaluation.delete.mockResolvedValue(mockCritere);

    await service.remove(mockCritere.id, ORG_ID);

    expect(prismaMock.critereEvaluation.delete).toHaveBeenCalledWith({ where: { id: mockCritere.id } });
  });

  it('lève NotFoundException lors de la suppression d\'un critère inconnu', async () => {
    prismaMock.critereEvaluation.count.mockResolvedValue(0);

    await expect(service.remove('inconnu', ORG_ID)).rejects.toThrow(NotFoundException);
  });
});
