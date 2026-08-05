import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { ObjectifService } from './objectif.service';

describe('ObjectifService', () => {
  let service: ObjectifService;
  const ORG_ID = 'org-001';
  const AUTRE_ORG_ID = 'org-002';

  const mockObjectif = {
    id: 'objectif-001',
    nom: 'Digitaliser la gestion administrative',
    description: null,
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    objectif: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ObjectifService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(ObjectifService);
  });

  it('crée un objectif rattaché à l\'organisation', async () => {
    prismaMock.objectif.create.mockResolvedValue(mockObjectif);

    const result = await service.create(ORG_ID, { nom: mockObjectif.nom });

    expect(result).toEqual(mockObjectif);
    expect(prismaMock.objectif.create).toHaveBeenCalledWith({
      data: { nom: mockObjectif.nom, organisationId: ORG_ID },
    });
  });

  it('liste les objectifs d\'une organisation', async () => {
    prismaMock.objectif.findMany.mockResolvedValue([mockObjectif]);

    const result = await service.findAll(ORG_ID);

    expect(result).toEqual([mockObjectif]);
    expect(prismaMock.objectif.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organisationId: ORG_ID } }),
    );
  });

  it('retourne un objectif par id', async () => {
    prismaMock.objectif.findUnique.mockResolvedValue(mockObjectif);

    const result = await service.findOne(mockObjectif.id, ORG_ID);

    expect(result).toEqual(mockObjectif);
  });

  it('lève NotFoundException si l\'objectif est introuvable', async () => {
    prismaMock.objectif.findUnique.mockResolvedValue(null);

    await expect(service.findOne('inconnu', ORG_ID)).rejects.toThrow(NotFoundException);
  });

  it('lève NotFoundException si l\'objectif appartient à une autre organisation', async () => {
    prismaMock.objectif.findUnique.mockResolvedValue(mockObjectif);

    await expect(service.findOne(mockObjectif.id, AUTRE_ORG_ID)).rejects.toThrow(NotFoundException);
  });

  it('met à jour un objectif existant', async () => {
    prismaMock.objectif.count.mockResolvedValue(1);
    prismaMock.objectif.update.mockResolvedValue({ ...mockObjectif, nom: 'Nouveau nom' });

    const result = await service.update(mockObjectif.id, ORG_ID, { nom: 'Nouveau nom' });

    expect(result.nom).toBe('Nouveau nom');
  });

  it('lève NotFoundException lors de la mise à jour d\'un objectif inconnu', async () => {
    prismaMock.objectif.count.mockResolvedValue(0);

    await expect(service.update('inconnu', ORG_ID, { nom: 'x' })).rejects.toThrow(NotFoundException);
  });

  it('supprime un objectif existant', async () => {
    prismaMock.objectif.count.mockResolvedValue(1);
    prismaMock.objectif.delete.mockResolvedValue(mockObjectif);

    await service.remove(mockObjectif.id, ORG_ID);

    expect(prismaMock.objectif.delete).toHaveBeenCalledWith({ where: { id: mockObjectif.id } });
  });

  it('lève NotFoundException lors de la suppression d\'un objectif inconnu', async () => {
    prismaMock.objectif.count.mockResolvedValue(0);

    await expect(service.remove('inconnu', ORG_ID)).rejects.toThrow(NotFoundException);
  });
});
