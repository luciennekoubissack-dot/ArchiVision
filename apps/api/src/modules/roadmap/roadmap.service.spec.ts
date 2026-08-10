import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { RoadmapService } from './roadmap.service';

describe('RoadmapService', () => {
  let service: RoadmapService;
  const ORG_ID = 'org-001';
  const AUTRE_ORG_ID = 'org-002';

  const mockProjet = {
    id: 'projet-001',
    nom: 'Migration ERP',
    description: null,
    priorite: 'HAUTE',
    coutEstime: '50000€',
    dateDebut: new Date('2026-09-01T00:00:00.000Z'),
    dateFin: new Date('2026-12-01T00:00:00.000Z'),
    statut: 'PLANIFIE',
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    projet: {
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
      providers: [RoadmapService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(RoadmapService);
  });

  it('crée un projet rattaché à l\'organisation', async () => {
    prismaMock.projet.create.mockResolvedValue(mockProjet);

    const result = await service.create(ORG_ID, { nom: mockProjet.nom, priorite: 'HAUTE' as never });

    expect(result).toEqual(mockProjet);
  });

  it('convertit les dates ISO en objets Date à la création', async () => {
    prismaMock.projet.create.mockResolvedValue(mockProjet);

    await service.create(ORG_ID, { nom: mockProjet.nom, dateDebut: '2026-09-01', dateFin: '2026-12-01' });

    expect(prismaMock.projet.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dateDebut: new Date('2026-09-01'), dateFin: new Date('2026-12-01') }),
      }),
    );
  });

  it('lève NotFoundException si le projet appartient à une autre organisation', async () => {
    prismaMock.projet.findUnique.mockResolvedValue(mockProjet);

    await expect(service.findOne(mockProjet.id, AUTRE_ORG_ID)).rejects.toThrow(NotFoundException);
  });

  it('supprime un projet existant', async () => {
    prismaMock.projet.count.mockResolvedValue(1);
    prismaMock.projet.delete.mockResolvedValue(mockProjet);

    await service.remove(mockProjet.id, ORG_ID);

    expect(prismaMock.projet.delete).toHaveBeenCalledWith({ where: { id: mockProjet.id } });
  });

  it('lève NotFoundException lors de la suppression d\'un projet inconnu', async () => {
    prismaMock.projet.count.mockResolvedValue(0);

    await expect(service.remove('inconnu', ORG_ID)).rejects.toThrow(NotFoundException);
  });
});
