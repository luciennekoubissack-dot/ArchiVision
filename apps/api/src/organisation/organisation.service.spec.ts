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
    logoUrl: null,
    secteur: null,
    taille: null,
    pays: null,
    ville: null,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const selectAttendu = {
    id: true,
    nom: true,
    description: true,
    logoUrl: true,
    secteur: true,
    taille: true,
    pays: true,
    ville: true,
    vision: true,
    problemesResoudre: true,
    statut: true,
    createdAt: true,
    updatedAt: true,
  };

  const prismaMock = {
    organisation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    capaciteMetier: { findMany: jest.fn() },
    elementArchimate: { findMany: jest.fn() },
    relationArchimate: { findMany: jest.fn() },
    application: { findMany: jest.fn() },
    zoneUrbanisation: { findMany: jest.fn() },
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

  describe('findMine', () => {
    it("retourne l'organisation de l'appelant", async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(mockOrganisation);

      const result = await service.findMine(mockOrganisation.id);

      expect(result).toEqual(mockOrganisation);
      expect(prismaMock.organisation.findUnique).toHaveBeenCalledWith({
        where: { id: mockOrganisation.id },
        select: selectAttendu,
      });
    });

    it('lève NotFoundException si introuvable', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(null);

      await expect(service.findMine('inconnue')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMine', () => {
    it("met à jour l'organisation de l'appelant", async () => {
      const updated = { ...mockOrganisation, nom: 'K&B Groupe mis à jour' };
      prismaMock.organisation.findUnique.mockResolvedValue(mockOrganisation);
      prismaMock.organisation.update.mockResolvedValue(updated);

      const result = await service.updateMine(mockOrganisation.id, { nom: updated.nom });

      expect(result).toEqual(updated);
      expect(prismaMock.organisation.update).toHaveBeenCalledWith({
        where: { id: mockOrganisation.id },
        data: { nom: updated.nom },
        select: selectAttendu,
      });
    });

    it('lève NotFoundException si l\'organisation est introuvable', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(null);

      await expect(service.updateMine('inconnue', { nom: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('exportReferentiel', () => {
    it('agrège le référentiel complet de l\'organisation', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(mockOrganisation);
      prismaMock.capaciteMetier.findMany.mockResolvedValue([{ id: 'cap-1' }]);
      prismaMock.elementArchimate.findMany.mockResolvedValue([{ id: 'elem-1' }]);
      prismaMock.relationArchimate.findMany.mockResolvedValue([{ id: 'rel-1' }]);
      prismaMock.application.findMany.mockResolvedValue([{ id: 'app-1' }]);
      prismaMock.zoneUrbanisation.findMany.mockResolvedValue([{ id: 'zone-1' }]);

      const result = await service.exportReferentiel(mockOrganisation.id);

      expect(result.organisation).toEqual(mockOrganisation);
      expect(result.capacites).toEqual([{ id: 'cap-1' }]);
      expect(result.elements).toEqual([{ id: 'elem-1' }]);
      expect(result.relations).toEqual([{ id: 'rel-1' }]);
      expect(result.applications).toEqual([{ id: 'app-1' }]);
      expect(result.zones).toEqual([{ id: 'zone-1' }]);
      expect(typeof result.exportedAt).toBe('string');
    });

    it('lève NotFoundException si l\'organisation est introuvable', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(null);
      prismaMock.capaciteMetier.findMany.mockResolvedValue([]);
      prismaMock.elementArchimate.findMany.mockResolvedValue([]);
      prismaMock.relationArchimate.findMany.mockResolvedValue([]);
      prismaMock.application.findMany.mockResolvedValue([]);
      prismaMock.zoneUrbanisation.findMany.mockResolvedValue([]);

      await expect(service.exportReferentiel('inconnue')).rejects.toThrow(NotFoundException);
    });
  });
});
