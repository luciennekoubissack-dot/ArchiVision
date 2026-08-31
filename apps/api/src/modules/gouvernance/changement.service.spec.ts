import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { ChangementService } from './changement.service';

describe('ChangementService', () => {
  let service: ChangementService;
  const ORG_ID = 'org-001';

  const mockChangement = {
    id: 'changement-001',
    titre: 'Migrer vers TLS 1.3',
    description: null,
    statut: 'PROPOSE',
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    demandeChangement: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const countMock = prismaMock.demandeChangement.count as jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChangementService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(ChangementService);
  });

  it('crée une demande de changement rattachée à l\'organisation', async () => {
    prismaMock.demandeChangement.create.mockResolvedValue(mockChangement);
    const result = await service.create(ORG_ID, { titre: mockChangement.titre });
    expect(result).toEqual(mockChangement);
    expect(prismaMock.demandeChangement.create).toHaveBeenCalledWith({
      data: { titre: mockChangement.titre, organisationId: ORG_ID },
    });
  });

  it('liste les demandes de changement d\'une organisation', async () => {
    prismaMock.demandeChangement.findMany.mockResolvedValue([mockChangement]);
    const result = await service.findAll(ORG_ID);
    expect(result).toEqual([mockChangement]);
  });

  it('met à jour le statut d\'une demande existante', async () => {
    prismaMock.demandeChangement.count.mockResolvedValue(1);
    prismaMock.demandeChangement.update.mockResolvedValue({ ...mockChangement, statut: 'APPROUVE' });
    const result = await service.update(mockChangement.id, ORG_ID, { statut: 'APPROUVE' as never });
    expect(result.statut).toBe('APPROUVE');
  });

  it('lève NotFoundException lors de la mise à jour d\'une demande inconnue', async () => {
    prismaMock.demandeChangement.count.mockResolvedValue(0);
    await expect(service.update('inconnu', ORG_ID, { titre: 'x' })).rejects.toThrow(NotFoundException);
  });

  it('supprime une demande existante', async () => {
    prismaMock.demandeChangement.count.mockResolvedValue(1);
    prismaMock.demandeChangement.delete.mockResolvedValue(mockChangement);
    await service.remove(mockChangement.id, ORG_ID);
    expect(prismaMock.demandeChangement.delete).toHaveBeenCalledWith({ where: { id: mockChangement.id } });
  });

  it('lève NotFoundException lors de la suppression d\'une demande inconnue', async () => {
    prismaMock.demandeChangement.count.mockResolvedValue(0);
    await expect(service.remove('inconnu', ORG_ID)).rejects.toThrow(NotFoundException);
  });

  it('calcule les statistiques (total et en cours) sans charger la liste complète', async () => {
    countMock.mockResolvedValueOnce(5).mockResolvedValueOnce(2);
    const result = await service.getStats(ORG_ID);
    expect(result).toEqual({ total: 5, enCours: 2 });
    expect(countMock).toHaveBeenNthCalledWith(1, { where: { organisationId: ORG_ID } });
    expect(countMock).toHaveBeenNthCalledWith(2, {
      where: { organisationId: ORG_ID, statut: { in: ['PROPOSE', 'APPROUVE'] } },
    });
  });
});
