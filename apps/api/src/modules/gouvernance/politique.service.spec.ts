import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { PolitiqueService } from './politique.service';

describe('PolitiqueService', () => {
  let service: PolitiqueService;
  const ORG_ID = 'org-001';

  const mockPolitique = {
    id: 'politique-001',
    nom: 'Chiffrement des données au repos',
    description: null,
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    politiqueGouvernance: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [PolitiqueService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(PolitiqueService);
  });

  it('crée une politique rattachée à l\'organisation', async () => {
    prismaMock.politiqueGouvernance.create.mockResolvedValue(mockPolitique);
    const result = await service.create(ORG_ID, { nom: mockPolitique.nom });
    expect(result).toEqual(mockPolitique);
    expect(prismaMock.politiqueGouvernance.create).toHaveBeenCalledWith({
      data: { nom: mockPolitique.nom, organisationId: ORG_ID },
    });
  });

  it('liste les politiques d\'une organisation', async () => {
    prismaMock.politiqueGouvernance.findMany.mockResolvedValue([mockPolitique]);
    const result = await service.findAll(ORG_ID);
    expect(result).toEqual([mockPolitique]);
  });

  it('met à jour une politique existante', async () => {
    prismaMock.politiqueGouvernance.count.mockResolvedValue(1);
    prismaMock.politiqueGouvernance.update.mockResolvedValue({ ...mockPolitique, nom: 'Nouveau nom' });
    const result = await service.update(mockPolitique.id, ORG_ID, { nom: 'Nouveau nom' });
    expect(result.nom).toBe('Nouveau nom');
  });

  it('lève NotFoundException lors de la mise à jour d\'une politique inconnue', async () => {
    prismaMock.politiqueGouvernance.count.mockResolvedValue(0);
    await expect(service.update('inconnu', ORG_ID, { nom: 'x' })).rejects.toThrow(NotFoundException);
  });

  it('supprime une politique existante', async () => {
    prismaMock.politiqueGouvernance.count.mockResolvedValue(1);
    prismaMock.politiqueGouvernance.delete.mockResolvedValue(mockPolitique);
    await service.remove(mockPolitique.id, ORG_ID);
    expect(prismaMock.politiqueGouvernance.delete).toHaveBeenCalledWith({ where: { id: mockPolitique.id } });
  });

  it('lève NotFoundException lors de la suppression d\'une politique inconnue', async () => {
    prismaMock.politiqueGouvernance.count.mockResolvedValue(0);
    await expect(service.remove('inconnu', ORG_ID)).rejects.toThrow(NotFoundException);
  });
});
