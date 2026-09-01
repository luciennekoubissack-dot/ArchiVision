import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { AdminService } from './admin.service';
import { MailService } from '../mail/mail.service';

describe('AdminService', () => {
  let service: AdminService;
  const ORG_ID = 'org-001';

  const completeOrg = {
    id: ORG_ID,
    nom: 'Entreprise Test',
    secteur: 'Conseil',
    pays: 'France',
    ville: 'Paris',
    vision: 'Digitaliser la gestion administrative',
    statut: 'EN_ATTENTE',
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    validatedAt: null,
    users: [
      {
        id: 'user-001',
        nom: 'Chef Entreprise',
        email: 'admin@entreprise-test.local',
        role: 'ADMINISTRATEUR',
        createdAt: new Date('2026-08-01T10:00:00.000Z'),
      },
    ],
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

  const configMock = {
    get: jest.fn((key: string) => (key === 'FRONTEND_ORIGIN' ? 'http://localhost:4201' : undefined)),
  };

  const mailMock = {
    sendOrganisationValidee: jest.fn((to: string, _nom: string, loginUrl: string) =>
      Promise.resolve({ to, subject: 'Bienvenue sur ArchiVision : votre organisation est validée', body: loginUrl }),
    ),
    sendOrganisationRejetee: jest.fn((to: string) =>
      Promise.resolve({ to, subject: "ArchiVision : votre demande d'inscription", body: '' }),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: configMock },
        { provide: MailService, useValue: mailMock },
      ],
    }).compile();

    service = module.get(AdminService);
  });

  describe('valider', () => {
    it('passe le statut à VALIDEE et envoie l\'e-mail de connexion à l\'administrateur quand le dossier est complet', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(completeOrg);
      prismaMock.organisation.update.mockResolvedValue({ ...completeOrg, statut: 'VALIDEE' });

      const result = await service.valider(ORG_ID);

      expect(prismaMock.organisation.update).toHaveBeenCalledWith({
        where: { id: ORG_ID },
        data: { statut: 'VALIDEE', validatedAt: expect.any(Date) },
        include: { _count: { select: { users: true } } },
      });
      expect(mailMock.sendOrganisationValidee).toHaveBeenCalledWith(
        'admin@entreprise-test.local',
        'Entreprise Test',
        'http://localhost:4201/login',
      );
      expect(result.email.to).toBe('admin@entreprise-test.local');
      expect(result.email.subject).toContain('validée');
    });

    it('lève BadRequestException si un champ de revue est manquant (ville)', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue({ ...completeOrg, ville: '  ' });

      await expect(service.valider(ORG_ID)).rejects.toThrow(BadRequestException);
      expect(prismaMock.organisation.update).not.toHaveBeenCalled();
      expect(mailMock.sendOrganisationValidee).not.toHaveBeenCalled();
    });

    it("lève BadRequestException si l'organisation n'a pas de compte administrateur", async () => {
      prismaMock.organisation.findUnique.mockResolvedValue({ ...completeOrg, users: [] });

      await expect(service.valider(ORG_ID)).rejects.toThrow(BadRequestException);
      expect(prismaMock.organisation.update).not.toHaveBeenCalled();
    });

    it('lève NotFoundException si l\'organisation est introuvable', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(null);

      await expect(service.valider('inconnu')).rejects.toThrow(NotFoundException);
      expect(prismaMock.organisation.update).not.toHaveBeenCalled();
    });
  });

  describe('rejeter', () => {
    it('passe le statut à REJETEE et envoie l\'e-mail de notification', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(completeOrg);
      prismaMock.organisation.update.mockResolvedValue({ ...completeOrg, statut: 'REJETEE' });
      prismaMock.user.findFirst.mockResolvedValue({ email: 'admin@entreprise-test.local' });

      const result = await service.rejeter(ORG_ID);

      expect(prismaMock.organisation.update).toHaveBeenCalledWith({
        where: { id: ORG_ID },
        data: { statut: 'REJETEE' },
        include: { _count: { select: { users: true } } },
      });
      expect(mailMock.sendOrganisationRejetee).toHaveBeenCalledWith(
        'admin@entreprise-test.local',
        'Entreprise Test',
      );
      expect(result.email.subject).not.toContain('validée');
    });
  });

  describe('remove', () => {
    it("supprime l'organisation existante", async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(completeOrg);

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
