import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { PartiesPrenantesService } from './parties-prenantes.service';

describe('PartiesPrenantesService', () => {
  let service: PartiesPrenantesService;
  const ORG_ID = 'org-001';

  const mockPartie = { id: 'pp-001', nom: 'Client principal', role: 'Client', organisationId: ORG_ID };

  const prismaMock = {
    partiePrenante: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [PartiesPrenantesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(PartiesPrenantesService);
  });

  it('crée une partie prenante rattachée à l\'organisation', async () => {
    prismaMock.partiePrenante.create.mockResolvedValue(mockPartie);

    const result = await service.create(ORG_ID, { nom: mockPartie.nom, role: mockPartie.role });

    expect(result).toEqual(mockPartie);
  });

  it('lève NotFoundException lors de la suppression d\'une partie prenante inconnue', async () => {
    prismaMock.partiePrenante.count.mockResolvedValue(0);

    await expect(service.remove('inconnu', ORG_ID)).rejects.toThrow(NotFoundException);
  });
});
