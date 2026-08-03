import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import { PrismaService } from '@archivision/infrastructure';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-001',
    email: 'admin@archivision.local',
    passwordHash: '',
    nom: 'Admin',
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
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
    it('retourne un accessToken et le user pour des identifiants valides', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      jwtMock.sign.mockReturnValue('signed.jwt.token');

      const result = await service.login('admin@archivision.local', 'Admin123!');

      expect(result).toEqual({
        accessToken: 'signed.jwt.token',
        user: { id: mockUser.id, email: mockUser.email, nom: mockUser.nom },
      });
      expect(jwtMock.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
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
  });

  describe('me', () => {
    it("retourne le profil de l'utilisateur courant", async () => {
      const { passwordHash: _unused, ...profile } = mockUser;
      prismaMock.user.findUnique.mockResolvedValue(profile);

      const result = await service.me(mockUser.id);

      expect(result).toEqual(profile);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: { id: true, email: true, nom: true, createdAt: true },
      });
    });

    it("lève UnauthorizedException si l'utilisateur est introuvable", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.me('inconnu')).rejects.toThrow(
        new UnauthorizedException('Utilisateur introuvable'),
      );
    });
  });
});
