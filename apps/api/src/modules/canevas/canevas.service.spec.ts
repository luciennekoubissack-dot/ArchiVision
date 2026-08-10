import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { ElementKind, TypeRelation } from '@prisma/client';
import { CanevasService } from './canevas.service';

describe('CanevasService', () => {
  let service: CanevasService;
  const ORG_ID = 'org-001';
  const AUTRE_ORG_ID = 'org-002';

  const mockRelation = {
    id: 'canevas-rel-001',
    type: TypeRelation.REALISATION,
    sourceKind: ElementKind.APPLICATION,
    sourceId: 'app-001',
    targetKind: ElementKind.ARCHIMATE,
    targetId: 'elem-001',
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    elementArchimate: { count: jest.fn() },
    application: { count: jest.fn() },
    techComponent: { count: jest.fn() },
    dataEntity: { count: jest.fn() },
    canevasRelation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CanevasService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(CanevasService);
  });

  describe('createRelation', () => {
    it('crée une relation Application → ArchiMate quand les deux appartiennent à l\'organisation', async () => {
      prismaMock.application.count.mockResolvedValue(1);
      prismaMock.elementArchimate.count.mockResolvedValue(1);
      prismaMock.canevasRelation.create.mockResolvedValue(mockRelation);

      const result = await service.createRelation(ORG_ID, {
        type: TypeRelation.REALISATION,
        sourceKind: ElementKind.APPLICATION,
        sourceId: 'app-001',
        targetKind: ElementKind.ARCHIMATE,
        targetId: 'elem-001',
      });

      expect(result).toEqual(mockRelation);
      expect(prismaMock.application.count).toHaveBeenCalledWith({ where: { id: 'app-001', organisationId: ORG_ID } });
      expect(prismaMock.elementArchimate.count).toHaveBeenCalledWith({ where: { id: 'elem-001', organisationId: ORG_ID } });
      expect(prismaMock.canevasRelation.create).toHaveBeenCalledWith({
        data: {
          type: TypeRelation.REALISATION,
          sourceKind: ElementKind.APPLICATION,
          sourceId: 'app-001',
          targetKind: ElementKind.ARCHIMATE,
          targetId: 'elem-001',
          organisationId: ORG_ID,
        },
      });
    });

    it('crée une relation Application → Composant technique (autre couple de couches)', async () => {
      prismaMock.application.count.mockResolvedValue(1);
      prismaMock.techComponent.count.mockResolvedValue(1);
      prismaMock.canevasRelation.create.mockResolvedValue({
        ...mockRelation,
        targetKind: ElementKind.TECH_COMPONENT,
        targetId: 'tech-001',
      });

      await service.createRelation(ORG_ID, {
        type: TypeRelation.ASSOCIATION,
        sourceKind: ElementKind.APPLICATION,
        sourceId: 'app-001',
        targetKind: ElementKind.TECH_COMPONENT,
        targetId: 'tech-001',
      });

      expect(prismaMock.techComponent.count).toHaveBeenCalledWith({ where: { id: 'tech-001', organisationId: ORG_ID } });
    });

    it('lève NotFoundException si la source n\'appartient pas à l\'organisation', async () => {
      prismaMock.application.count.mockResolvedValue(0);
      prismaMock.elementArchimate.count.mockResolvedValue(1);

      await expect(
        service.createRelation(AUTRE_ORG_ID, {
          type: TypeRelation.REALISATION,
          sourceKind: ElementKind.APPLICATION,
          sourceId: 'app-001',
          targetKind: ElementKind.ARCHIMATE,
          targetId: 'elem-001',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaMock.canevasRelation.create).not.toHaveBeenCalled();
    });

    it('lève NotFoundException si la cible est introuvable', async () => {
      prismaMock.application.count.mockResolvedValue(1);
      prismaMock.elementArchimate.count.mockResolvedValue(0);

      await expect(
        service.createRelation(ORG_ID, {
          type: TypeRelation.REALISATION,
          sourceKind: ElementKind.APPLICATION,
          sourceId: 'app-001',
          targetKind: ElementKind.ARCHIMATE,
          targetId: 'inconnu',
        }),
      ).rejects.toThrow(NotFoundException);
      expect(prismaMock.canevasRelation.create).not.toHaveBeenCalled();
    });

    it('lève BadRequestException si source et cible sont identiques', async () => {
      await expect(
        service.createRelation(ORG_ID, {
          type: TypeRelation.ASSOCIATION,
          sourceKind: ElementKind.APPLICATION,
          sourceId: 'app-001',
          targetKind: ElementKind.APPLICATION,
          targetId: 'app-001',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.application.count).not.toHaveBeenCalled();
      expect(prismaMock.canevasRelation.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('liste les relations d\'une organisation', async () => {
      prismaMock.canevasRelation.findMany.mockResolvedValue([mockRelation]);

      const result = await service.findAll(ORG_ID);

      expect(result).toEqual([mockRelation]);
      expect(prismaMock.canevasRelation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organisationId: ORG_ID } }),
      );
    });
  });

  describe('remove', () => {
    it('supprime une relation appartenant à l\'organisation', async () => {
      prismaMock.canevasRelation.findUnique.mockResolvedValue(mockRelation);
      prismaMock.canevasRelation.delete.mockResolvedValue(mockRelation);

      await service.remove(mockRelation.id, ORG_ID);

      expect(prismaMock.canevasRelation.delete).toHaveBeenCalledWith({ where: { id: mockRelation.id } });
    });

    it('lève NotFoundException si la relation est introuvable', async () => {
      prismaMock.canevasRelation.findUnique.mockResolvedValue(null);

      await expect(service.remove('inconnue', ORG_ID)).rejects.toThrow(NotFoundException);
    });

    it('lève NotFoundException si la relation appartient à une autre organisation', async () => {
      prismaMock.canevasRelation.findUnique.mockResolvedValue({ ...mockRelation, organisationId: AUTRE_ORG_ID });

      await expect(service.remove(mockRelation.id, ORG_ID)).rejects.toThrow(NotFoundException);
      expect(prismaMock.canevasRelation.delete).not.toHaveBeenCalled();
    });
  });
});
