import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { ServiceService } from './service.service';

describe('ServiceService', () => {
  let service: ServiceService;
  const ORG_ID = 'org-001';
  const AUTRE_ORG_ID = 'org-002';

  const mockService = {
    id: 'service-001',
    nom: 'Direction Générale',
    description: null,
    parentId: null,
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    service: {
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
      providers: [ServiceService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(ServiceService);
  });

  it('crée un service racine rattaché à l\'organisation', async () => {
    prismaMock.service.create.mockResolvedValue(mockService);

    const result = await service.create(ORG_ID, { nom: mockService.nom });

    expect(result).toEqual(mockService);
    expect(prismaMock.service.create).toHaveBeenCalledWith({
      data: { organisationId: ORG_ID, nom: mockService.nom, description: undefined },
    });
  });

  it('crée un service enfant (avec parentId)', async () => {
    const enfant = { ...mockService, id: 'service-002', parentId: mockService.id };
    prismaMock.service.create.mockResolvedValue(enfant);

    await service.create(ORG_ID, { nom: enfant.nom, parentId: mockService.id });

    expect(prismaMock.service.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ parentId: mockService.id }),
    });
  });

  it('liste les services d\'une organisation', async () => {
    prismaMock.service.findMany.mockResolvedValue([mockService]);

    const result = await service.findAll(ORG_ID);

    expect(result).toEqual([mockService]);
    expect(prismaMock.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organisationId: ORG_ID } }),
    );
  });

  it('retourne un service par id', async () => {
    prismaMock.service.findUnique.mockResolvedValue(mockService);

    const result = await service.findOne(mockService.id, ORG_ID);

    expect(result).toEqual(mockService);
  });

  it('lève NotFoundException si le service est introuvable', async () => {
    prismaMock.service.findUnique.mockResolvedValue(null);

    await expect(service.findOne('inconnu', ORG_ID)).rejects.toThrow(NotFoundException);
  });

  it('lève NotFoundException si le service appartient à une autre organisation', async () => {
    prismaMock.service.findUnique.mockResolvedValue(mockService);

    await expect(service.findOne(mockService.id, AUTRE_ORG_ID)).rejects.toThrow(NotFoundException);
  });

  it('met à jour un service existant', async () => {
    prismaMock.service.count.mockResolvedValue(1);
    prismaMock.service.update.mockResolvedValue({ ...mockService, nom: 'Nouveau nom' });

    const result = await service.update(mockService.id, ORG_ID, { nom: 'Nouveau nom' });

    expect(result.nom).toBe('Nouveau nom');
  });

  it('lève NotFoundException lors de la mise à jour d\'un service inconnu', async () => {
    prismaMock.service.count.mockResolvedValue(0);

    await expect(service.update('inconnu', ORG_ID, { nom: 'x' })).rejects.toThrow(NotFoundException);
  });

  it('supprime un service existant', async () => {
    prismaMock.service.count.mockResolvedValue(1);
    prismaMock.service.delete.mockResolvedValue(mockService);

    await service.remove(mockService.id, ORG_ID);

    expect(prismaMock.service.delete).toHaveBeenCalledWith({ where: { id: mockService.id } });
  });

  it('lève NotFoundException lors de la suppression d\'un service inconnu', async () => {
    prismaMock.service.count.mockResolvedValue(0);

    await expect(service.remove('inconnu', ORG_ID)).rejects.toThrow(NotFoundException);
  });
});
