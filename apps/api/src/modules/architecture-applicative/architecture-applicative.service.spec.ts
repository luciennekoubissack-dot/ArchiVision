import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { ArchitectureApplicativeService } from './architecture-applicative.service';

describe('ArchitectureApplicativeService', () => {
  let service: ArchitectureApplicativeService;
  const ORG_ID = 'org-001';
  const AUTRE_ORG_ID = 'org-002';

  const mockElement = {
    id: 'elem-001',
    nom: 'CRM',
    type: 'APPLICATION',
    description: null,
    positionX: null,
    positionY: null,
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    archiApplicativeElement: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    archiApplicativeFlux: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ArchitectureApplicativeService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(ArchitectureApplicativeService);
  });

  describe('éléments', () => {
    it('crée un élément rattaché à l\'organisation de l\'appelant', async () => {
      prismaMock.archiApplicativeElement.create.mockResolvedValue(mockElement);

      const result = await service.createElement(ORG_ID, { nom: mockElement.nom, type: 'APPLICATION' as never });

      expect(result).toEqual(mockElement);
      expect(prismaMock.archiApplicativeElement.create).toHaveBeenCalledWith({
        data: { nom: mockElement.nom, type: 'APPLICATION', organisationId: ORG_ID },
      });
    });

    it('liste les éléments d\'une organisation', async () => {
      prismaMock.archiApplicativeElement.findMany.mockResolvedValue([mockElement]);

      const result = await service.findAllElements(ORG_ID);

      expect(result).toEqual([mockElement]);
    });

    it('lève NotFoundException en consultant un élément d\'une autre organisation', async () => {
      prismaMock.archiApplicativeElement.findUnique.mockResolvedValue(mockElement);

      await expect(service.findOneElement(mockElement.id, AUTRE_ORG_ID)).rejects.toThrow(NotFoundException);
    });

    it('met à jour un élément existant', async () => {
      prismaMock.archiApplicativeElement.findUnique.mockResolvedValue(mockElement);
      prismaMock.archiApplicativeElement.update.mockResolvedValue({ ...mockElement, nom: 'CRM v2' });

      const result = await service.updateElement(mockElement.id, ORG_ID, { nom: 'CRM v2' });

      expect(result.nom).toBe('CRM v2');
    });

    it('supprime un élément existant', async () => {
      prismaMock.archiApplicativeElement.findUnique.mockResolvedValue(mockElement);
      prismaMock.archiApplicativeElement.delete.mockResolvedValue(mockElement);

      await service.removeElement(mockElement.id, ORG_ID);

      expect(prismaMock.archiApplicativeElement.delete).toHaveBeenCalledWith({ where: { id: mockElement.id } });
    });
  });

  describe('flux', () => {
    const elementB = { ...mockElement, id: 'elem-002', nom: 'ERP' };

    it('refuse un flux dont la source appartient à une autre organisation', async () => {
      prismaMock.archiApplicativeElement.findUnique
        .mockResolvedValueOnce({ ...mockElement, organisationId: AUTRE_ORG_ID })
        .mockResolvedValueOnce(elementB);

      await expect(
        service.createFlux(ORG_ID, { sourceId: mockElement.id, targetId: elementB.id }),
      ).rejects.toThrow(BadRequestException);
    });

    it('crée un flux entre deux éléments de la même organisation', async () => {
      prismaMock.archiApplicativeElement.findUnique
        .mockResolvedValueOnce(mockElement)
        .mockResolvedValueOnce(elementB);
      prismaMock.archiApplicativeFlux.create.mockResolvedValue({
        id: 'flux-001',
        sourceId: mockElement.id,
        targetId: elementB.id,
        type: 'DONNEES',
        label: null,
      });

      const result = await service.createFlux(ORG_ID, { sourceId: mockElement.id, targetId: elementB.id });

      expect(result.id).toBe('flux-001');
    });

    it('lève NotFoundException en supprimant un flux d\'une autre organisation', async () => {
      prismaMock.archiApplicativeFlux.findUnique.mockResolvedValue({
        id: 'flux-001',
        source: { ...mockElement, organisationId: AUTRE_ORG_ID },
      });

      await expect(service.removeFlux('flux-001', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
