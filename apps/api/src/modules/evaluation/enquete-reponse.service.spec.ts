import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { EnqueteReponseService } from './enquete-reponse.service';

describe('EnqueteReponseService', () => {
  let service: EnqueteReponseService;
  const ORG_ID = 'org-001';

  const mockReponse = {
    id: 'reponse-001',
    repondant: 'Directeur commercial',
    score: 4,
    commentaire: null,
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    enqueteReponse: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnqueteReponseService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(EnqueteReponseService);
  });

  it('liste les réponses d\'une organisation', async () => {
    prismaMock.enqueteReponse.findMany.mockResolvedValue([mockReponse]);
    const result = await service.findAll(ORG_ID);
    expect(result).toEqual([mockReponse]);
  });

  it('importe un lot de réponses rattachées à l\'organisation', async () => {
    prismaMock.enqueteReponse.createMany.mockResolvedValue({ count: 1 });
    prismaMock.enqueteReponse.findMany.mockResolvedValue([mockReponse]);

    const result = await service.importReponses(ORG_ID, [
      { repondant: mockReponse.repondant, score: mockReponse.score },
    ]);

    expect(prismaMock.enqueteReponse.createMany).toHaveBeenCalledWith({
      data: [{ repondant: mockReponse.repondant, score: mockReponse.score, organisationId: ORG_ID }],
    });
    expect(result).toEqual([mockReponse]);
  });

  it('supprime une réponse existante', async () => {
    prismaMock.enqueteReponse.count.mockResolvedValue(1);
    prismaMock.enqueteReponse.delete.mockResolvedValue(mockReponse);
    await service.remove(mockReponse.id, ORG_ID);
    expect(prismaMock.enqueteReponse.delete).toHaveBeenCalledWith({ where: { id: mockReponse.id } });
  });

  it('lève NotFoundException lors de la suppression d\'une réponse inconnue', async () => {
    prismaMock.enqueteReponse.count.mockResolvedValue(0);
    await expect(service.remove('inconnu', ORG_ID)).rejects.toThrow(NotFoundException);
  });
});
