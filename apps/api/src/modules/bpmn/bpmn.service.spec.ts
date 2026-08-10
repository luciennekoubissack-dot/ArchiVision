import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { BpmnService } from './bpmn.service';

describe('BpmnService', () => {
  let service: BpmnService;
  const ORG_ID = 'org-001';
  const AUTRE_ORG_ID = 'org-002';

  const mockProcessus = {
    id: 'processus-001',
    nom: 'Traitement de commande',
    description: null,
    bpmnXml: null,
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const mockElement = {
    id: 'element-001',
    nom: 'Valider la commande',
    type: 'TACHE',
    statut: 'LES_DEUX',
    positionX: null,
    positionY: null,
    processusId: mockProcessus.id,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    bpmnProcessus: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    bpmnElement: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    bpmnFlow: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [BpmnService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(BpmnService);
  });

  describe('processus', () => {
    it('crée un processus rattaché à l\'organisation', async () => {
      prismaMock.bpmnProcessus.create.mockResolvedValue(mockProcessus);

      const result = await service.create(ORG_ID, { nom: mockProcessus.nom });

      expect(result).toEqual(mockProcessus);
      expect(prismaMock.bpmnProcessus.create).toHaveBeenCalledWith({
        data: { nom: mockProcessus.nom, organisationId: ORG_ID },
      });
    });

    it('lève NotFoundException si le processus appartient à une autre organisation', async () => {
      prismaMock.bpmnProcessus.findUnique.mockResolvedValue(mockProcessus);

      await expect(service.findOne(mockProcessus.id, AUTRE_ORG_ID)).rejects.toThrow(NotFoundException);
    });

    it('supprime un processus existant', async () => {
      prismaMock.bpmnProcessus.count.mockResolvedValue(1);
      prismaMock.bpmnProcessus.delete.mockResolvedValue(mockProcessus);

      await service.remove(mockProcessus.id, ORG_ID);

      expect(prismaMock.bpmnProcessus.delete).toHaveBeenCalledWith({ where: { id: mockProcessus.id } });
    });
  });

  describe('elements', () => {
    it('ajoute un élément à un processus de son organisation', async () => {
      prismaMock.bpmnProcessus.count.mockResolvedValue(1);
      prismaMock.bpmnElement.create.mockResolvedValue(mockElement);

      const result = await service.addElement(mockProcessus.id, ORG_ID, {
        nom: mockElement.nom,
        type: 'TACHE' as never,
      });

      expect(result).toEqual(mockElement);
    });

    it('lève NotFoundException si le processus cible appartient à une autre organisation', async () => {
      prismaMock.bpmnProcessus.count.mockResolvedValue(0);

      await expect(
        service.addElement(mockProcessus.id, AUTRE_ORG_ID, { nom: 'x', type: 'TACHE' as never }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lève NotFoundException en modifiant un élément appartenant à une autre organisation', async () => {
      prismaMock.bpmnElement.findUnique.mockResolvedValue({
        ...mockElement,
        processus: { ...mockProcessus, organisationId: AUTRE_ORG_ID },
      });

      await expect(service.updateElement(mockElement.id, ORG_ID, { nom: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('flows', () => {
    it("refuse un flux entre deux éléments de processus différents", async () => {
      prismaMock.bpmnProcessus.count.mockResolvedValue(1);
      prismaMock.bpmnElement.findUnique
        .mockResolvedValueOnce({ ...mockElement, processusId: mockProcessus.id })
        .mockResolvedValueOnce({ ...mockElement, id: 'element-002', processusId: 'autre-processus' });

      await expect(
        service.addFlow(mockProcessus.id, ORG_ID, { sourceId: mockElement.id, targetId: 'element-002' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('crée un flux entre deux éléments du même processus', async () => {
      prismaMock.bpmnProcessus.count.mockResolvedValue(1);
      prismaMock.bpmnElement.findUnique
        .mockResolvedValueOnce({ ...mockElement, processusId: mockProcessus.id })
        .mockResolvedValueOnce({ ...mockElement, id: 'element-002', processusId: mockProcessus.id });
      prismaMock.bpmnFlow.create.mockResolvedValue({
        id: 'flow-001',
        sourceId: mockElement.id,
        targetId: 'element-002',
        label: null,
      });

      const result = await service.addFlow(mockProcessus.id, ORG_ID, {
        sourceId: mockElement.id,
        targetId: 'element-002',
      });

      expect(result.id).toBe('flow-001');
    });
  });
});
