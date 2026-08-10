import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { DonneesService } from './donnees.service';

describe('DonneesService', () => {
  let service: DonneesService;
  const ORG_ID = 'org-001';
  const AUTRE_ORG_ID = 'org-002';

  const mockEntity = {
    id: 'entity-001',
    nom: 'Client',
    description: null,
    statut: 'LES_DEUX',
    positionX: null,
    positionY: null,
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    dataEntity: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    dataAttribute: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    dataRelation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [DonneesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(DonneesService);
  });

  it('crée une entité rattachée à l\'organisation', async () => {
    prismaMock.dataEntity.create.mockResolvedValue(mockEntity);

    const result = await service.create(ORG_ID, { nom: mockEntity.nom });

    expect(result).toEqual(mockEntity);
  });

  it('lève NotFoundException si l\'entité appartient à une autre organisation', async () => {
    prismaMock.dataEntity.findUnique.mockResolvedValue(mockEntity);

    await expect(service.findOne(mockEntity.id, AUTRE_ORG_ID)).rejects.toThrow(NotFoundException);
  });

  it('ajoute un attribut à une entité de son organisation', async () => {
    prismaMock.dataEntity.count.mockResolvedValue(1);
    prismaMock.dataAttribute.create.mockResolvedValue({ id: 'attr-001', nom: 'email', type: 'string', entityId: mockEntity.id });

    const result = await service.addAttribute(mockEntity.id, ORG_ID, { nom: 'email', type: 'string' });

    expect(result.nom).toBe('email');
  });

  it('lève NotFoundException en supprimant un attribut d\'une autre organisation', async () => {
    prismaMock.dataAttribute.findUnique.mockResolvedValue({
      id: 'attr-001',
      entity: { ...mockEntity, organisationId: AUTRE_ORG_ID },
    });

    await expect(service.removeAttribute('attr-001', ORG_ID)).rejects.toThrow(NotFoundException);
  });

  it('refuse une relation entre entités de deux organisations différentes', async () => {
    prismaMock.dataEntity.findUnique
      .mockResolvedValueOnce(mockEntity)
      .mockResolvedValueOnce({ ...mockEntity, id: 'entity-002', organisationId: AUTRE_ORG_ID });

    await expect(
      service.createRelation(ORG_ID, { sourceId: mockEntity.id, targetId: 'entity-002', cardinalite: 'UN_A_PLUSIEURS' as never }),
    ).rejects.toThrow(BadRequestException);
  });

  it('crée une relation entre deux entités de la même organisation', async () => {
    prismaMock.dataEntity.findUnique
      .mockResolvedValueOnce(mockEntity)
      .mockResolvedValueOnce({ ...mockEntity, id: 'entity-002' });
    prismaMock.dataRelation.create.mockResolvedValue({
      id: 'rel-001',
      sourceId: mockEntity.id,
      targetId: 'entity-002',
      cardinalite: 'UN_A_PLUSIEURS',
      label: null,
    });

    const result = await service.createRelation(ORG_ID, {
      sourceId: mockEntity.id,
      targetId: 'entity-002',
      cardinalite: 'UN_A_PLUSIEURS' as never,
    });

    expect(result.id).toBe('rel-001');
  });
});
