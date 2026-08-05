import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { Criticite, TypeZone } from '@prisma/client';
import { UrbanisationService } from './urbanisation.service';

describe('UrbanisationService', () => {
  let service: UrbanisationService;
  const ORG_ID = 'org-001';
  const AUTRE_ORG_ID = 'org-002';

  const mockApplication = {
    id: 'app-001',
    nom: 'CRM',
    description: null,
    criticite: Criticite.HAUTE,
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const mockZone = {
    id: 'zone-001',
    nom: 'Zone commerciale',
    type: TypeZone.ZONE,
    parentId: null,
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const mockIlot = { ...mockZone, id: 'zone-002', nom: 'Îlot A', type: TypeZone.ILOT };

  const mockAffectation = {
    applicationId: mockApplication.id,
    zoneId: mockIlot.id,
  };

  const prismaMock = {
    application: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    zoneUrbanisation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    applicationZone: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UrbanisationService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(UrbanisationService);
  });

  describe('Applications', () => {
    it('crée une application rattachée à l\'organisation de l\'appelant', async () => {
      prismaMock.application.create.mockResolvedValue(mockApplication);

      const result = await service.createApplication(ORG_ID, {
        nom: mockApplication.nom,
        criticite: mockApplication.criticite,
      });

      expect(result).toEqual(mockApplication);
      expect(prismaMock.application.create).toHaveBeenCalledWith({
        data: { nom: mockApplication.nom, criticite: mockApplication.criticite, organisationId: ORG_ID },
      });
    });

    it('liste les applications d\'une organisation', async () => {
      prismaMock.application.findMany.mockResolvedValue([mockApplication]);

      const result = await service.findAllApplications(ORG_ID);

      expect(result).toEqual([mockApplication]);
    });

    it('retourne une application par id', async () => {
      prismaMock.application.findUnique.mockResolvedValue(mockApplication);

      const result = await service.findOneApplication(mockApplication.id, ORG_ID);

      expect(result).toEqual(mockApplication);
    });

    it('lève NotFoundException si l\'application est introuvable', async () => {
      prismaMock.application.findUnique.mockResolvedValue(null);

      await expect(service.findOneApplication('inconnue', ORG_ID)).rejects.toThrow(NotFoundException);
    });

    it('lève NotFoundException si l\'application appartient à une autre organisation', async () => {
      prismaMock.application.findUnique.mockResolvedValue(mockApplication);

      await expect(service.findOneApplication(mockApplication.id, AUTRE_ORG_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('met à jour une application existante', async () => {
      prismaMock.application.count.mockResolvedValue(1);
      prismaMock.application.update.mockResolvedValue({ ...mockApplication, nom: 'ERP' });

      const result = await service.updateApplication(mockApplication.id, ORG_ID, { nom: 'ERP' });

      expect(result.nom).toBe('ERP');
    });

    it('lève NotFoundException lors de la mise à jour d\'une application inconnue', async () => {
      prismaMock.application.count.mockResolvedValue(0);

      await expect(service.updateApplication('inconnue', ORG_ID, { nom: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('supprime une application existante', async () => {
      prismaMock.application.count.mockResolvedValue(1);
      prismaMock.application.delete.mockResolvedValue(mockApplication);

      await service.removeApplication(mockApplication.id, ORG_ID);

      expect(prismaMock.application.delete).toHaveBeenCalledWith({
        where: { id: mockApplication.id },
      });
    });

    it('lève NotFoundException lors de la suppression d\'une application inconnue', async () => {
      prismaMock.application.count.mockResolvedValue(0);

      await expect(service.removeApplication('inconnue', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Zones d\'urbanisation', () => {
    it('crée une zone racine (sans parent)', async () => {
      prismaMock.zoneUrbanisation.create.mockResolvedValue(mockZone);

      const result = await service.createZone(ORG_ID, { nom: mockZone.nom, type: mockZone.type });

      expect(result).toEqual(mockZone);
      expect(prismaMock.zoneUrbanisation.create).toHaveBeenCalledWith({
        data: {
          organisationId: ORG_ID,
          nom: mockZone.nom,
          type: mockZone.type,
        },
      });
    });

    it('crée une zone enfant (avec parentId)', async () => {
      const enfant = { ...mockZone, id: 'zone-002', type: TypeZone.QUARTIER, parentId: mockZone.id };
      prismaMock.zoneUrbanisation.create.mockResolvedValue(enfant);

      await service.createZone(ORG_ID, {
        nom: enfant.nom,
        type: enfant.type,
        parentId: mockZone.id,
      });

      expect(prismaMock.zoneUrbanisation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ parentId: mockZone.id }),
      });
    });

    it('liste les zones filtrées par type', async () => {
      prismaMock.zoneUrbanisation.findMany.mockResolvedValue([mockZone]);

      const result = await service.findAllZones(ORG_ID, TypeZone.ZONE);

      expect(result).toEqual([mockZone]);
      expect(prismaMock.zoneUrbanisation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organisationId: ORG_ID, type: TypeZone.ZONE } }),
      );
    });

    it('retourne une zone par id', async () => {
      prismaMock.zoneUrbanisation.findUnique.mockResolvedValue(mockZone);

      const result = await service.findOneZone(mockZone.id, ORG_ID);

      expect(result).toEqual(mockZone);
    });

    it('lève NotFoundException si la zone est introuvable', async () => {
      prismaMock.zoneUrbanisation.findUnique.mockResolvedValue(null);

      await expect(service.findOneZone('inconnue', ORG_ID)).rejects.toThrow(NotFoundException);
    });

    it('lève NotFoundException si la zone appartient à une autre organisation', async () => {
      prismaMock.zoneUrbanisation.findUnique.mockResolvedValue(mockZone);

      await expect(service.findOneZone(mockZone.id, AUTRE_ORG_ID)).rejects.toThrow(NotFoundException);
    });

    it('permet de détacher une zone de son parent (parentId: null)', async () => {
      prismaMock.zoneUrbanisation.count.mockResolvedValue(1);
      prismaMock.zoneUrbanisation.update.mockResolvedValue({ ...mockZone, parentId: null });

      await service.updateZone(mockZone.id, ORG_ID, { parentId: null });

      expect(prismaMock.zoneUrbanisation.update).toHaveBeenCalledWith({
        where: { id: mockZone.id },
        data: { parentId: null },
      });
    });

    it('lève NotFoundException lors de la mise à jour d\'une zone inconnue', async () => {
      prismaMock.zoneUrbanisation.count.mockResolvedValue(0);

      await expect(service.updateZone('inconnue', ORG_ID, { nom: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('supprime une zone existante', async () => {
      prismaMock.zoneUrbanisation.count.mockResolvedValue(1);
      prismaMock.zoneUrbanisation.delete.mockResolvedValue(mockZone);

      await service.removeZone(mockZone.id, ORG_ID);

      expect(prismaMock.zoneUrbanisation.delete).toHaveBeenCalledWith({
        where: { id: mockZone.id },
      });
    });

    it('lève NotFoundException lors de la suppression d\'une zone inconnue', async () => {
      prismaMock.zoneUrbanisation.count.mockResolvedValue(0);

      await expect(service.removeZone('inconnue', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Affectation application ↔ zone', () => {
    it('affecte une application à un îlot', async () => {
      prismaMock.application.count.mockResolvedValue(1);
      prismaMock.zoneUrbanisation.findUnique.mockResolvedValue({ type: TypeZone.ILOT, organisationId: ORG_ID });
      prismaMock.applicationZone.findUnique.mockResolvedValue(null);
      prismaMock.applicationZone.create.mockResolvedValue(mockAffectation);

      const result = await service.affecter(ORG_ID, {
        applicationId: mockApplication.id,
        zoneId: mockIlot.id,
      });

      expect(result).toEqual(mockAffectation);
    });

    it('lève NotFoundException si l\'application est introuvable', async () => {
      prismaMock.application.count.mockResolvedValue(0);
      prismaMock.zoneUrbanisation.findUnique.mockResolvedValue({ type: TypeZone.ILOT, organisationId: ORG_ID });

      await expect(
        service.affecter(ORG_ID, { applicationId: 'inconnue', zoneId: mockIlot.id }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lève NotFoundException si la zone est introuvable', async () => {
      prismaMock.application.count.mockResolvedValue(1);
      prismaMock.zoneUrbanisation.findUnique.mockResolvedValue(null);

      await expect(
        service.affecter(ORG_ID, { applicationId: mockApplication.id, zoneId: 'inconnue' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lève NotFoundException si la zone appartient à une autre organisation', async () => {
      prismaMock.application.count.mockResolvedValue(1);
      prismaMock.zoneUrbanisation.findUnique.mockResolvedValue({ type: TypeZone.ILOT, organisationId: AUTRE_ORG_ID });

      await expect(
        service.affecter(ORG_ID, { applicationId: mockApplication.id, zoneId: mockIlot.id }),
      ).rejects.toThrow(NotFoundException);
    });

    it("lève BadRequestException si la zone visée n'est pas un îlot (ex. une ZONE)", async () => {
      prismaMock.application.count.mockResolvedValue(1);
      prismaMock.zoneUrbanisation.findUnique.mockResolvedValue({ type: TypeZone.ZONE, organisationId: ORG_ID });

      await expect(
        service.affecter(ORG_ID, { applicationId: mockApplication.id, zoneId: mockZone.id }),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.applicationZone.create).not.toHaveBeenCalled();
    });

    it('lève ConflictException si l\'affectation existe déjà', async () => {
      prismaMock.application.count.mockResolvedValue(1);
      prismaMock.zoneUrbanisation.findUnique.mockResolvedValue({ type: TypeZone.ILOT, organisationId: ORG_ID });
      prismaMock.applicationZone.findUnique.mockResolvedValue(mockAffectation);

      await expect(
        service.affecter(ORG_ID, { applicationId: mockApplication.id, zoneId: mockIlot.id }),
      ).rejects.toThrow(ConflictException);
      expect(prismaMock.applicationZone.create).not.toHaveBeenCalled();
    });

    it('désaffecte une application d\'un îlot', async () => {
      prismaMock.application.count.mockResolvedValue(1);
      prismaMock.zoneUrbanisation.count.mockResolvedValue(1);
      prismaMock.applicationZone.findUnique.mockResolvedValue(mockAffectation);
      prismaMock.applicationZone.delete.mockResolvedValue(mockAffectation);

      await service.desaffecter(ORG_ID, mockApplication.id, mockIlot.id);

      expect(prismaMock.applicationZone.delete).toHaveBeenCalledWith({
        where: {
          applicationId_zoneId: { applicationId: mockApplication.id, zoneId: mockIlot.id },
        },
      });
    });

    it('lève NotFoundException si l\'affectation à supprimer est introuvable', async () => {
      prismaMock.application.count.mockResolvedValue(1);
      prismaMock.zoneUrbanisation.count.mockResolvedValue(1);
      prismaMock.applicationZone.findUnique.mockResolvedValue(null);

      await expect(
        service.desaffecter(ORG_ID, mockApplication.id, mockIlot.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('lève NotFoundException si l\'application à désaffecter appartient à une autre organisation', async () => {
      prismaMock.application.count.mockResolvedValue(0);

      await expect(
        service.desaffecter(AUTRE_ORG_ID, mockApplication.id, mockIlot.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
