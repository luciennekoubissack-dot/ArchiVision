import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { OrganisationService } from './organisation.service';

describe('OrganisationService', () => {
  let service: OrganisationService;

  const mockOrganisation = {
    id: 'org-001',
    nom: 'K&B Groupe SARL',
    description: 'Organisation de test',
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    organisation: {
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
      providers: [
        OrganisationService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(OrganisationService);
  });

  it('crée une organisation', async () => {
    prismaMock.organisation.create.mockResolvedValue(mockOrganisation);

    const result = await service.create({
      nom: mockOrganisation.nom,
      description: mockOrganisation.description,
    });

    expect(result).toEqual(mockOrganisation);
    expect(prismaMock.organisation.create).toHaveBeenCalledWith({
      data: { nom: mockOrganisation.nom, description: mockOrganisation.description },
      select: {
        id: true,
        nom: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it('retourne toutes les organisations triées par nom', async () => {
    prismaMock.organisation.findMany.mockResolvedValue([mockOrganisation]);

    const result = await service.findAll();

    expect(result).toEqual([mockOrganisation]);
    expect(prismaMock.organisation.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        nom: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { nom: 'asc' },
    });
  });

  it('retourne une organisation par id', async () => {
    prismaMock.organisation.findUnique.mockResolvedValue(mockOrganisation);

    const result = await service.findOne(mockOrganisation.id);

    expect(result).toEqual(mockOrganisation);
  });

  it('lève NotFoundException si l’organisation est introuvable', async () => {
    prismaMock.organisation.findUnique.mockResolvedValue(null);

    await expect(service.findOne('inconnue')).rejects.toThrow(
      new NotFoundException('Organisation inconnue introuvable'),
    );
  });

  it('met à jour une organisation existante', async () => {
    const updated = { ...mockOrganisation, nom: 'K&B Groupe mis à jour' };
    prismaMock.organisation.count.mockResolvedValue(1);
    prismaMock.organisation.update.mockResolvedValue(updated);

    const result = await service.update(mockOrganisation.id, { nom: updated.nom });

    expect(result).toEqual(updated);
    expect(prismaMock.organisation.update).toHaveBeenCalledWith({
      where: { id: mockOrganisation.id },
      data: { nom: updated.nom },
      select: {
        id: true,
        nom: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it('lève NotFoundException lors d’une mise à jour sur un id inconnu', async () => {
    prismaMock.organisation.count.mockResolvedValue(0);

    await expect(service.update('inconnue', { nom: 'Test' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('supprime une organisation existante', async () => {
    prismaMock.organisation.count.mockResolvedValue(1);
    prismaMock.organisation.delete.mockResolvedValue(mockOrganisation);

    await service.remove(mockOrganisation.id);

    expect(prismaMock.organisation.delete).toHaveBeenCalledWith({
      where: { id: mockOrganisation.id },
    });
  });

  it('lève NotFoundException lors d’une suppression sur un id inconnu', async () => {
    prismaMock.organisation.count.mockResolvedValue(0);

    await expect(service.remove('inconnue')).rejects.toThrow(NotFoundException);
  });
});
