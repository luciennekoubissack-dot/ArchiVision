import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { TechnologieService } from './technologie.service';

describe('TechnologieService', () => {
  let service: TechnologieService;
  const ORG_ID = 'org-001';
  const AUTRE_ORG_ID = 'org-002';

  const mockComponent = {
    id: 'tech-001',
    nom: 'Serveur principal',
    type: 'SERVEUR',
    description: null,
    statut: 'LES_DEUX',
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const mockApplication = { id: 'app-001', organisationId: ORG_ID };

  const prismaMock = {
    techComponent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
    },
    techDeploiement: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TechnologieService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(TechnologieService);
  });

  it('crée un composant technique rattaché à l\'organisation', async () => {
    prismaMock.techComponent.create.mockResolvedValue(mockComponent);

    const result = await service.create(ORG_ID, { nom: mockComponent.nom, type: 'SERVEUR' as never });

    expect(result).toEqual(mockComponent);
  });

  it('lève NotFoundException si le composant appartient à une autre organisation', async () => {
    prismaMock.techComponent.findUnique.mockResolvedValue(mockComponent);

    await expect(service.findOne(mockComponent.id, AUTRE_ORG_ID)).rejects.toThrow(NotFoundException);
  });

  it("refuse un déploiement si l'application n'appartient pas à l'organisation", async () => {
    prismaMock.application.findUnique.mockResolvedValue({ ...mockApplication, organisationId: AUTRE_ORG_ID });
    prismaMock.techComponent.findUnique.mockResolvedValue(mockComponent);

    await expect(
      service.deployer(ORG_ID, { applicationId: mockApplication.id, techComponentId: mockComponent.id }),
    ).rejects.toThrow(BadRequestException);
  });

  it('refuse un déploiement en doublon', async () => {
    prismaMock.application.findUnique.mockResolvedValue(mockApplication);
    prismaMock.techComponent.findUnique.mockResolvedValue(mockComponent);
    prismaMock.techDeploiement.findUnique.mockResolvedValue({ applicationId: mockApplication.id, techComponentId: mockComponent.id });

    await expect(
      service.deployer(ORG_ID, { applicationId: mockApplication.id, techComponentId: mockComponent.id }),
    ).rejects.toThrow(ConflictException);
  });

  it('déploie une application sur un composant de la même organisation', async () => {
    prismaMock.application.findUnique.mockResolvedValue(mockApplication);
    prismaMock.techComponent.findUnique.mockResolvedValue(mockComponent);
    prismaMock.techDeploiement.findUnique.mockResolvedValue(null);
    prismaMock.techDeploiement.create.mockResolvedValue({ applicationId: mockApplication.id, techComponentId: mockComponent.id });

    const result = await service.deployer(ORG_ID, {
      applicationId: mockApplication.id,
      techComponentId: mockComponent.id,
    });

    expect(result.applicationId).toBe(mockApplication.id);
  });
});
