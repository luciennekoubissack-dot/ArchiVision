import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import { PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-001',
    email: 'admin@archivision.local',
    passwordHash: '',
    nom: 'Admin',
    organisationId: 'org-001',
    role: RoleUtilisateur.ADMINISTRATEUR,
    organisation: { statut: 'VALIDEE' as const },
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const txMock = {
    organisation: { create: jest.fn() },
    user: { create: jest.fn() },
  };

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: typeof txMock) => unknown) => callback(txMock)),
  };

  const jwtMock = {
    sign: jest.fn(),
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('Admin123!', 4);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('login', () => {
    it('retourne un accessToken et le user pour des identifiants valides (organisation VALIDEE)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      jwtMock.sign.mockReturnValue('signed.jwt.token');

      const result = await service.login('admin@archivision.local', 'Admin123!');

      expect(result).toEqual({
        accessToken: 'signed.jwt.token',
        user: { id: mockUser.id, email: mockUser.email, nom: mockUser.nom, avatarUrl: null, role: mockUser.role },
      });
      expect(jwtMock.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        organisationId: mockUser.organisationId,
        role: mockUser.role,
      });
    });

    it("lève UnauthorizedException si le mot de passe est incorrect", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login('admin@archivision.local', 'mauvais-mdp')).rejects.toThrow(
        new UnauthorizedException('Email ou mot de passe incorrect'),
      );
      expect(jwtMock.sign).not.toHaveBeenCalled();
    });

    it("lève UnauthorizedException si l'utilisateur n'existe pas", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.login('inconnu@archivision.local', 'peu-importe')).rejects.toThrow(
        new UnauthorizedException('Email ou mot de passe incorrect'),
      );
    });

    it('compare quand même un hash factice si le user est introuvable (protection timing)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const compareSpy = jest.spyOn(bcrypt, 'compare');

      await expect(service.login('inconnu@archivision.local', 'peu-importe')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(compareSpy).toHaveBeenCalledWith(
        'peu-importe',
        expect.stringContaining('$2b$10$invalidhashfortimingprotection'),
      );
    });

    it("lève ForbiddenException si l'organisation est EN_ATTENTE", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        organisation: { statut: 'EN_ATTENTE' },
      });

      await expect(service.login('admin@archivision.local', 'Admin123!')).rejects.toThrow(
        ForbiddenException,
      );
      expect(jwtMock.sign).not.toHaveBeenCalled();
    });

    it("lève ForbiddenException si l'organisation est REJETEE", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        organisation: { statut: 'REJETEE' },
      });

      await expect(service.login('admin@archivision.local', 'Admin123!')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("laisse passer le SUPERADMIN qui n'a pas d'organisation", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        role: RoleUtilisateur.SUPERADMIN,
        organisationId: null,
        organisation: null,
      });
      jwtMock.sign.mockReturnValue('signed.jwt.token');

      const result = await service.login('admin@archivision.local', 'Admin123!');

      expect(result.accessToken).toBe('signed.jwt.token');
    });
  });

  describe('register', () => {
    const registerDto = {
      organisationNom: 'Nouvelle Entreprise',
      secteur: 'Conseil',
      pays: 'France',
      ville: 'Lyon',
      vision: 'Digitaliser la gestion administrative',
      email: 'fondateur@nouvelle-entreprise.local',
      password: 'MotDePasse123!',
      nom: 'Fondateur',
    };

    it("crée une organisation EN_ATTENTE et son premier administrateur, sans ouvrir de session", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const createdOrg = {
        id: 'org-002',
        nom: registerDto.organisationNom,
        description: null,
        secteur: registerDto.secteur,
        taille: null,
        pays: registerDto.pays,
        ville: registerDto.ville,
        logoUrl: null,
        statut: 'EN_ATTENTE',
      };
      const createdUser = {
        id: 'user-002',
        email: registerDto.email,
        nom: registerDto.nom,
        avatarUrl: null,
        organisationId: createdOrg.id,
        role: RoleUtilisateur.ADMINISTRATEUR,
      };
      txMock.organisation.create.mockResolvedValue(createdOrg);
      txMock.user.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(txMock.organisation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nom: registerDto.organisationNom,
            secteur: registerDto.secteur,
            pays: registerDto.pays,
            ville: registerDto.ville,
            vision: registerDto.vision,
          }),
        }),
      );
      expect(txMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organisationId: createdOrg.id,
            role: RoleUtilisateur.ADMINISTRATEUR,
          }),
        }),
      );
      // Aucune session n'est émise à l'inscription.
      expect(jwtMock.sign).not.toHaveBeenCalled();
      expect(result).toEqual({
        organisation: { id: createdOrg.id, nom: createdOrg.nom, statut: createdOrg.statut },
        message: expect.any(String),
      });
      expect(result).not.toHaveProperty('accessToken');
    });

    it('lève ConflictException si l\'email est déjà utilisé', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(txMock.organisation.create).not.toHaveBeenCalled();
    });
  });

  describe('me', () => {
    it("retourne le profil de l'utilisateur courant", async () => {
      const { passwordHash: _unused, organisationId: _org, organisation: _o, ...profile } = mockUser;
      prismaMock.user.findUnique.mockResolvedValue(profile);

      const result = await service.me(mockUser.id);

      expect(result).toEqual(profile);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: { id: true, email: true, nom: true, avatarUrl: true, role: true, createdAt: true },
      });
    });

    it("lève UnauthorizedException si l'utilisateur est introuvable", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.me('inconnu')).rejects.toThrow(
        new UnauthorizedException('Utilisateur introuvable'),
      );
    });
  });

  describe('updateMe', () => {
    it("met à jour uniquement les champs fournis (nom et/ou avatarUrl)", async () => {
      const updated = { id: mockUser.id, email: mockUser.email, nom: 'Nouveau nom', avatarUrl: 'https://example.com/a.png', role: mockUser.role, createdAt: mockUser.createdAt };
      prismaMock.user.update.mockResolvedValue(updated);

      const result = await service.updateMe(mockUser.id, { nom: 'Nouveau nom', avatarUrl: 'https://example.com/a.png' });

      expect(result).toEqual(updated);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { nom: 'Nouveau nom', avatarUrl: 'https://example.com/a.png' },
        select: { id: true, email: true, nom: true, avatarUrl: true, role: true, createdAt: true },
      });
    });

    it("n'inclut pas les champs absents du DTO dans la mise à jour", async () => {
      prismaMock.user.update.mockResolvedValue(mockUser);

      await service.updateMe(mockUser.id, {});

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {},
        select: { id: true, email: true, nom: true, avatarUrl: true, role: true, createdAt: true },
      });
    });
  });
});
