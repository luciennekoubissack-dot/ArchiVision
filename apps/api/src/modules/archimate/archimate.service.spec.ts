import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { TypeElement, TypeRelation } from '@prisma/client';
import { ArchimateService } from './archimate.service';

describe('ArchimateService', () => {
  let service: ArchimateService;

  const mockCapacite = {
    id: 'cap-001',
    nom: 'Gestion des formations',
    description: null,
    organisationId: 'org-001',
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const mockElement = {
    id: 'elem-001',
    nom: 'Formateur',
    type: TypeElement.ACTEUR_METIER,
    description: null,
    organisationId: 'org-001',
    capaciteMetierId: null,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const mockElementCible = { ...mockElement, id: 'elem-002', nom: 'Processus formation' };

  const mockRelation = {
    id: 'rel-001',
    type: TypeRelation.ASSIGNATION,
    sourceId: mockElement.id,
    targetId: mockElementCible.id,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    capaciteMetier: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    elementArchimate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    relationArchimate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ArchimateService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(ArchimateService);
  });

  describe('Capacités métier', () => {
    it('crée une capacité', async () => {
      prismaMock.capaciteMetier.create.mockResolvedValue(mockCapacite);

      const result = await service.createCapacite({
        organisationId: mockCapacite.organisationId,
        nom: mockCapacite.nom,
      });

      expect(result).toEqual(mockCapacite);
    });

    it('liste les capacités d\'une organisation', async () => {
      prismaMock.capaciteMetier.findMany.mockResolvedValue([mockCapacite]);

      const result = await service.findAllCapacites('org-001');

      expect(result).toEqual([mockCapacite]);
      expect(prismaMock.capaciteMetier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organisationId: 'org-001' } }),
      );
    });

    it('retourne une capacité par id', async () => {
      prismaMock.capaciteMetier.findUnique.mockResolvedValue(mockCapacite);

      const result = await service.findOneCapacite(mockCapacite.id);

      expect(result).toEqual(mockCapacite);
    });

    it('lève NotFoundException si la capacité est introuvable', async () => {
      prismaMock.capaciteMetier.findUnique.mockResolvedValue(null);

      await expect(service.findOneCapacite('inconnue')).rejects.toThrow(NotFoundException);
    });

    it('met à jour une capacité existante', async () => {
      prismaMock.capaciteMetier.count.mockResolvedValue(1);
      prismaMock.capaciteMetier.update.mockResolvedValue({ ...mockCapacite, nom: 'Nouveau nom' });

      const result = await service.updateCapacite(mockCapacite.id, { nom: 'Nouveau nom' });

      expect(result.nom).toBe('Nouveau nom');
    });

    it('lève NotFoundException lors de la mise à jour d\'une capacité inconnue', async () => {
      prismaMock.capaciteMetier.count.mockResolvedValue(0);

      await expect(service.updateCapacite('inconnue', { nom: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('supprime une capacité existante', async () => {
      prismaMock.capaciteMetier.count.mockResolvedValue(1);
      prismaMock.capaciteMetier.delete.mockResolvedValue(mockCapacite);

      await service.removeCapacite(mockCapacite.id);

      expect(prismaMock.capaciteMetier.delete).toHaveBeenCalledWith({
        where: { id: mockCapacite.id },
      });
    });

    it('lève NotFoundException lors de la suppression d\'une capacité inconnue', async () => {
      prismaMock.capaciteMetier.count.mockResolvedValue(0);

      await expect(service.removeCapacite('inconnue')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Éléments ArchiMate', () => {
    it('crée un élément sans capacité liée', async () => {
      prismaMock.elementArchimate.create.mockResolvedValue(mockElement);

      const result = await service.createElement({
        organisationId: mockElement.organisationId,
        nom: mockElement.nom,
        type: mockElement.type,
      });

      expect(result).toEqual(mockElement);
      expect(prismaMock.elementArchimate.create).toHaveBeenCalledWith({
        data: {
          organisationId: mockElement.organisationId,
          nom: mockElement.nom,
          type: mockElement.type,
          description: undefined,
        },
      });
    });

    it('crée un élément rattaché à une capacité', async () => {
      const withCapacite = { ...mockElement, capaciteMetierId: mockCapacite.id };
      prismaMock.elementArchimate.create.mockResolvedValue(withCapacite);

      await service.createElement({
        organisationId: mockElement.organisationId,
        nom: mockElement.nom,
        type: mockElement.type,
        capaciteMetierId: mockCapacite.id,
      });

      expect(prismaMock.elementArchimate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ capaciteMetierId: mockCapacite.id }),
      });
    });

    it('liste les éléments filtrés par type', async () => {
      prismaMock.elementArchimate.findMany.mockResolvedValue([mockElement]);

      const result = await service.findAllElements('org-001', TypeElement.ACTEUR_METIER);

      expect(result).toEqual([mockElement]);
      expect(prismaMock.elementArchimate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organisationId: 'org-001', type: TypeElement.ACTEUR_METIER },
        }),
      );
    });

    it('retourne un élément par id avec ses relations', async () => {
      prismaMock.elementArchimate.findUnique.mockResolvedValue(mockElement);

      const result = await service.findOneElement(mockElement.id);

      expect(result).toEqual(mockElement);
    });

    it('lève NotFoundException si l\'élément est introuvable', async () => {
      prismaMock.elementArchimate.findUnique.mockResolvedValue(null);

      await expect(service.findOneElement('inconnu')).rejects.toThrow(NotFoundException);
    });

    it('permet de détacher la capacité en passant capaciteMetierId à null', async () => {
      prismaMock.elementArchimate.count.mockResolvedValue(1);
      prismaMock.elementArchimate.update.mockResolvedValue({
        ...mockElement,
        capaciteMetierId: null,
      });

      await service.updateElement(mockElement.id, { capaciteMetierId: null });

      expect(prismaMock.elementArchimate.update).toHaveBeenCalledWith({
        where: { id: mockElement.id },
        data: { capaciteMetierId: null },
      });
    });

    it('lève NotFoundException lors de la mise à jour d\'un élément inconnu', async () => {
      prismaMock.elementArchimate.count.mockResolvedValue(0);

      await expect(service.updateElement('inconnu', { nom: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('supprime un élément existant', async () => {
      prismaMock.elementArchimate.count.mockResolvedValue(1);
      prismaMock.elementArchimate.delete.mockResolvedValue(mockElement);

      await service.removeElement(mockElement.id);

      expect(prismaMock.elementArchimate.delete).toHaveBeenCalledWith({
        where: { id: mockElement.id },
      });
    });

    it('lève NotFoundException lors de la suppression d\'un élément inconnu', async () => {
      prismaMock.elementArchimate.count.mockResolvedValue(0);

      await expect(service.removeElement('inconnu')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Relations ArchiMate', () => {
    it('crée une relation si source et target existent', async () => {
      prismaMock.elementArchimate.count.mockResolvedValue(1);
      prismaMock.relationArchimate.create.mockResolvedValue(mockRelation);

      const result = await service.createRelation({
        type: mockRelation.type,
        sourceId: mockRelation.sourceId,
        targetId: mockRelation.targetId,
      });

      expect(result).toEqual(mockRelation);
    });

    it('lève NotFoundException si la source est introuvable', async () => {
      prismaMock.elementArchimate.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);

      await expect(
        service.createRelation({
          type: mockRelation.type,
          sourceId: 'inconnu',
          targetId: mockRelation.targetId,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaMock.relationArchimate.create).not.toHaveBeenCalled();
    });

    it('lève NotFoundException si la cible est introuvable', async () => {
      prismaMock.elementArchimate.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

      await expect(
        service.createRelation({
          type: mockRelation.type,
          sourceId: mockRelation.sourceId,
          targetId: 'inconnue',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaMock.relationArchimate.create).not.toHaveBeenCalled();
    });

    it('liste les relations d\'une organisation', async () => {
      prismaMock.relationArchimate.findMany.mockResolvedValue([mockRelation]);

      const result = await service.findAllRelations('org-001');

      expect(result).toEqual([mockRelation]);
      expect(prismaMock.relationArchimate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { source: { organisationId: 'org-001' } } }),
      );
    });

    it('supprime une relation existante', async () => {
      prismaMock.relationArchimate.findUnique.mockResolvedValue(mockRelation);
      prismaMock.relationArchimate.delete.mockResolvedValue(mockRelation);

      await service.removeRelation(mockRelation.id);

      expect(prismaMock.relationArchimate.delete).toHaveBeenCalledWith({
        where: { id: mockRelation.id },
      });
    });

    it('lève NotFoundException lors de la suppression d\'une relation inconnue', async () => {
      prismaMock.relationArchimate.findUnique.mockResolvedValue(null);

      await expect(service.removeRelation('inconnue')).rejects.toThrow(NotFoundException);
    });
  });
});
