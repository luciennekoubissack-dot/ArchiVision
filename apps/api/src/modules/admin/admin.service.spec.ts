import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  const ORG_ID = 'org-001';

  const mockOrganisation = {
    id: ORG_ID,
    nom: 'Entreprise Test',
    statut: 'EN_ATTENTE',
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    validatedAt: null,
  };

  const prismaMock = {
    organisation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(AdminService);
  });

  describe('valider', () => {
    it('passe le statut à VALIDEE et renvoie un email simulé pour l\'administrateur', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(mockOrganisation);
      prismaMock.organisation.update.mockResolvedValue({ ...mockOrganisation, statut: 'VALIDEE' });
      prismaMock.user.findFirst.mockResolvedValue({ email: 'admin@entreprise-test.local' });

      const result = await service.valider(ORG_ID);

      expect(prismaMock.organisation.update).toHaveBeenCalledWith({
        where: { id: ORG_ID },
        data: { statut: 'VALIDEE', validatedAt: expect.any(Date) },
      });
      expect(result.email.to).toBe('admin@entreprise-test.local');
      expect(result.email.subject).toContain('validée');
    });

    it('lève NotFoundException si l\'organisation est introuvable', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(null);

      await expect(service.valider('inconnu')).rejects.toThrow(NotFoundException);
      expect(prismaMock.organisation.update).not.toHaveBeenCalled();
    });
  });

  describe('rejeter', () => {
    it('passe le statut à REJETEE et renvoie un email simulé', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(mockOrganisation);
      prismaMock.organisation.update.mockResolvedValue({ ...mockOrganisation, statut: 'REJETEE' });
      prismaMock.user.findFirst.mockResolvedValue({ email: 'admin@entreprise-test.local' });

      const result = await service.rejeter(ORG_ID);

      expect(prismaMock.organisation.update).toHaveBeenCalledWith({
        where: { id: ORG_ID },
        data: { statut: 'REJETEE' },
      });
      expect(result.email.subject).not.toContain('validée');
    });
  });

  describe('remove', () => {
    it("supprime l'organisation existante", async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(mockOrganisation);

      await service.remove(ORG_ID);

      expect(prismaMock.organisation.delete).toHaveBeenCalledWith({ where: { id: ORG_ID } });
    });

    it('lève NotFoundException si introuvable', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(null);

      await expect(service.remove('inconnu')).rejects.toThrow(NotFoundException);
      expect(prismaMock.organisation.delete).not.toHaveBeenCalled();
    });
  });

  describe('stats', () => {
    it('agrège les compteurs de la plateforme', async () => {
      prismaMock.user.count.mockResolvedValue(42);
      prismaMock.organisation.count
        .mockResolvedValueOnce(3) // EN_ATTENTE
        .mockResolvedValueOnce(10) // VALIDEE
        .mockResolvedValueOnce(1); // REJETEE

      const result = await service.stats();

      expect(result).toEqual({
        totalUtilisateurs: 42,
        organisations: { enAttente: 3, validees: 10, rejetees: 1, total: 14 },
      });
    });
  });
});
