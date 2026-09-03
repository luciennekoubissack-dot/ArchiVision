import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur, StatutInvitation } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { InvitationService } from './invitation.service';

describe('InvitationService', () => {
  let service: InvitationService;

  const futureDate = () => new Date(Date.now() + 60_000);
  const pastDate = () => new Date(Date.now() - 60_000);

  const prismaMock = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    invitation: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    organisation: { findUnique: jest.fn() },
    service: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  };
  const mailMock = { sendInvitation: jest.fn() };
  const jwtMock = { sign: jest.fn().mockReturnValue('signed.jwt.token') };
  const configMock = { get: jest.fn().mockReturnValue('http://localhost:4200') };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: configMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: MailService, useValue: mailMock },
      ],
    }).compile();

    service = module.get(InvitationService);
  });

  describe('create', () => {
    const dto = { email: 'Nouveau@K-and-B.local', role: 'ARCHITECTE' as const };

    it('crée une invitation en attente et envoie l\'e-mail', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.invitation.findFirst.mockResolvedValue(null);
      prismaMock.invitation.create.mockResolvedValue({
        id: 'inv-1',
        email: 'nouveau@k-and-b.local',
        role: RoleUtilisateur.ARCHITECTE,
        statut: StatutInvitation.EN_ATTENTE,
        serviceId: null,
        poste: null,
        contact: null,
        expiresAt: futureDate(),
        createdAt: new Date(),
        invitedBy: { nom: 'Admin K&B' },
      });
      prismaMock.organisation.findUnique.mockResolvedValue({ nom: 'K&B Groupe SARL' });

      const result = await service.create('org-001', 'user-admin', dto);

      expect(result.invitedByNom).toBe('Admin K&B');
      expect(prismaMock.invitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'nouveau@k-and-b.local', organisationId: 'org-001' }),
        }),
      );
      expect(mailMock.sendInvitation).toHaveBeenCalledWith(
        'nouveau@k-and-b.local',
        'K&B Groupe SARL',
        expect.any(String),
        expect.stringContaining('/rejoindre?token='),
      );
    });

    it('refuse si un compte existe déjà avec cet email', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-x' });

      await expect(service.create('org-001', 'user-admin', dto)).rejects.toThrow(ConflictException);
      expect(prismaMock.invitation.create).not.toHaveBeenCalled();
    });

    it('refuse si une invitation est déjà en attente pour cet email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.invitation.findFirst.mockResolvedValue({ id: 'inv-existante' });

      await expect(service.create('org-001', 'user-admin', dto)).rejects.toThrow(ConflictException);
      expect(prismaMock.invitation.create).not.toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('passe l\'invitation en REVOKEE', async () => {
      prismaMock.invitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        organisationId: 'org-001',
        statut: StatutInvitation.EN_ATTENTE,
      });
      prismaMock.invitation.update.mockResolvedValue({});

      await service.revoke('org-001', 'inv-1');

      expect(prismaMock.invitation.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { statut: StatutInvitation.REVOKEE },
      });
    });

    it('lève NotFoundException si l\'invitation appartient à une autre organisation', async () => {
      prismaMock.invitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        organisationId: 'org-002',
        statut: StatutInvitation.EN_ATTENTE,
      });

      await expect(service.revoke('org-001', 'inv-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByToken', () => {
    it('renvoie l\'e-mail, l\'organisation et le rôle', async () => {
      prismaMock.invitation.findUnique.mockResolvedValue({
        email: 'nouveau@k-and-b.local',
        role: RoleUtilisateur.ARCHITECTE,
        statut: StatutInvitation.EN_ATTENTE,
        expiresAt: futureDate(),
        organisation: { nom: 'K&B Groupe SARL', statut: 'VALIDEE' },
      });

      const result = await service.findByToken('jeton-brut');

      expect(result).toEqual({
        email: 'nouveau@k-and-b.local',
        organisationNom: 'K&B Groupe SARL',
        role: RoleUtilisateur.ARCHITECTE,
      });
    });

    it('lève BadRequestException si le lien a expiré', async () => {
      prismaMock.invitation.findUnique.mockResolvedValue({
        email: 'x@y.local',
        role: RoleUtilisateur.ARCHITECTE,
        statut: StatutInvitation.EN_ATTENTE,
        expiresAt: pastDate(),
        organisation: { nom: 'K&B', statut: 'VALIDEE' },
      });

      await expect(service.findByToken('jeton-brut')).rejects.toThrow(BadRequestException);
    });

    it('lève NotFoundException si l\'invitation a déjà été utilisée', async () => {
      prismaMock.invitation.findUnique.mockResolvedValue({
        email: 'x@y.local',
        role: RoleUtilisateur.ARCHITECTE,
        statut: StatutInvitation.ACCEPTEE,
        expiresAt: futureDate(),
        organisation: { nom: 'K&B', statut: 'VALIDEE' },
      });

      await expect(service.findByToken('jeton-brut')).rejects.toThrow(NotFoundException);
    });
  });

  describe('accept', () => {
    const baseInvitation = {
      id: 'inv-1',
      email: 'nouveau@k-and-b.local',
      role: RoleUtilisateur.ARCHITECTE,
      organisationId: 'org-001',
      serviceId: null,
      poste: null,
      contact: null,
      statut: StatutInvitation.EN_ATTENTE,
      expiresAt: futureDate(),
      organisation: { statut: 'VALIDEE' },
    };

    it('crée le compte, marque l\'invitation ACCEPTEE et ouvre la session', async () => {
      prismaMock.invitation.findUnique.mockResolvedValue(baseInvitation);
      prismaMock.user.findUnique.mockResolvedValue(null);
      const createdUser = {
        id: 'user-new',
        email: baseInvitation.email,
        nom: 'Nouvelle Recrue',
        role: RoleUtilisateur.ARCHITECTE,
        organisationId: 'org-001',
        avatarUrl: null,
      };
      prismaMock.$transaction.mockImplementation(async (cb: any) =>
        cb({
          user: { create: jest.fn().mockResolvedValue(createdUser) },
          invitation: { update: jest.fn().mockResolvedValue({}) },
        }),
      );

      const result = await service.accept({ token: 'jeton-brut', nom: 'Nouvelle Recrue', password: 'motdepasse8' });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user).toEqual({
        id: 'user-new',
        email: baseInvitation.email,
        nom: 'Nouvelle Recrue',
        avatarUrl: null,
        role: RoleUtilisateur.ARCHITECTE,
      });
      expect(jwtMock.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'user-new', organisationId: 'org-001', role: RoleUtilisateur.ARCHITECTE }),
      );
    });

    it('refuse un lien expiré', async () => {
      prismaMock.invitation.findUnique.mockResolvedValue({ ...baseInvitation, expiresAt: pastDate() });

      await expect(
        service.accept({ token: 'jeton-brut', nom: 'X', password: 'motdepasse8' }),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('refuse si un compte a été créé entre-temps avec cet email', async () => {
      prismaMock.invitation.findUnique.mockResolvedValue(baseInvitation);
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-existant' });

      await expect(
        service.accept({ token: 'jeton-brut', nom: 'X', password: 'motdepasse8' }),
      ).rejects.toThrow(ConflictException);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });
});
