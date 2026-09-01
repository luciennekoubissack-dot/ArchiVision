import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { ObjectifService } from './objectif.service';

const EVOLUTION_INCLUDE = {
  objectifAsIs: { select: { id: true, nom: true, statut: true } },
  objectifsToBe: { select: { id: true, nom: true, statut: true } },
};

describe('ObjectifService', () => {
  let service: ObjectifService;
  const ORG_ID = 'org-001';
  const AUTRE_ORG_ID = 'org-002';

  const mockObjectif = {
    id: 'objectif-001',
    nom: 'Digitaliser la gestion administrative',
    description: null,
    sousObjectif: null,
    statut: 'LES_DEUX',
    objectifAsIsId: null,
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const mockAsIs = { ...mockObjectif, id: 'objectif-as-is', nom: 'Gestion papier', statut: 'AS_IS' };

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
      include: EVOLUTION_INCLUDE,
    });
  });

  it('crée un objectif TO-BE relié à un objectif AS-IS existant', async () => {
    prismaMock.objectif.findUnique.mockResolvedValue(mockAsIs);
    prismaMock.objectif.create.mockResolvedValue({ ...mockObjectif, statut: 'TO_BE', objectifAsIsId: mockAsIs.id });

    const result = await service.create(ORG_ID, { nom: 'Gestion numérique', statut: 'TO_BE' as never, objectifAsIsId: mockAsIs.id });

    expect(result.objectifAsIsId).toBe(mockAsIs.id);
  });

  it('refuse un lien AS-IS sur un objectif qui n\'est pas TO-BE', async () => {
    await expect(
      service.create(ORG_ID, { nom: 'x', statut: 'AS_IS' as never, objectifAsIsId: mockAsIs.id }),
    ).rejects.toThrow(BadRequestException);
  });

  it('refuse un lien vers un objectif AS-IS introuvable ou d\'une autre organisation', async () => {
    prismaMock.objectif.findUnique.mockResolvedValue(null);

    await expect(
      service.create(ORG_ID, { nom: 'x', statut: 'TO_BE' as never, objectifAsIsId: 'inconnu' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('refuse un lien vers un objectif source qui n\'est pas lui-même AS-IS', async () => {
    prismaMock.objectif.findUnique.mockResolvedValue({ ...mockAsIs, statut: 'TO_BE' });

    await expect(
      service.create(ORG_ID, { nom: 'x', statut: 'TO_BE' as never, objectifAsIsId: mockAsIs.id }),
    ).rejects.toThrow(BadRequestException);
  });

  it('liste les objectifs d\'une organisation', async () => {
    prismaMock.objectif.findMany.mockResolvedValue([mockObjectif]);

    const result = await service.findAll(ORG_ID);

    expect(result).toEqual([mockObjectif]);
    expect(prismaMock.objectif.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organisationId: ORG_ID }, include: EVOLUTION_INCLUDE }),
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
    prismaMock.objectif.findUnique.mockResolvedValue(mockObjectif);
    prismaMock.objectif.update.mockResolvedValue({ ...mockObjectif, nom: 'Nouveau nom' });

    const result = await service.update(mockObjectif.id, ORG_ID, { nom: 'Nouveau nom' });

    expect(result.nom).toBe('Nouveau nom');
    expect(prismaMock.objectif.update).toHaveBeenCalledWith({
      where: { id: mockObjectif.id },
      data: { nom: 'Nouveau nom', objectifAsIsId: null },
      include: EVOLUTION_INCLUDE,
    });
  });

  it('efface le lien AS-IS d\'origine quand le statut ne redevient plus TO-BE', async () => {
    prismaMock.objectif.findUnique.mockResolvedValue({ ...mockObjectif, statut: 'TO_BE', objectifAsIsId: mockAsIs.id });
    prismaMock.objectif.update.mockResolvedValue({ ...mockObjectif, statut: 'LES_DEUX', objectifAsIsId: null });

    await service.update(mockObjectif.id, ORG_ID, { statut: 'LES_DEUX' as never });

    expect(prismaMock.objectif.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ objectifAsIsId: null }) }),
    );
  });

  it('lève NotFoundException lors de la mise à jour d\'un objectif inconnu', async () => {
    prismaMock.objectif.findUnique.mockResolvedValue(null);

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
