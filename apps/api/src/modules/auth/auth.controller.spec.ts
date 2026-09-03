import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { PrismaService } from '@archivision/infrastructure';
import { JwtAuthGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { AuthModule } from './auth.module';

describe('AuthController (HTTP)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

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

  const registerPayload = {
    organisationNom: 'Nouvelle Entreprise',
    secteur: 'Conseil',
    pays: 'France',
    ville: 'Lyon',
    vision: 'Digitaliser la gestion administrative',
    email: 'fondateur@nouvelle-entreprise.local',
    password: 'MotDePasse123!',
    nom: 'Fondateur',
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
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    // Supporte les deux formes utilisées par le service : callback (register)
    // et tableau de promesses (resetPassword).
    $transaction: jest.fn((arg: unknown) =>
      typeof arg === 'function' ? (arg as (tx: typeof txMock) => unknown)(txMock) : Promise.all(arg as Promise<unknown>[]),
    ),
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('Admin123!', 4);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET: 'test-secret', FRONTEND_ORIGIN: 'http://localhost:4201' })],
        }),
        AuthModule,
      ],
      providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    jwtService = moduleFixture.get(JwtService);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/register', () => {
    it("est accessible sans authentification, crée une organisation EN_ATTENTE + un Administrateur, sans ouvrir de session", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const createdOrg = {
        id: 'org-002',
        nom: registerPayload.organisationNom,
        description: null,
        secteur: registerPayload.secteur,
        taille: null,
        pays: registerPayload.pays,
        ville: registerPayload.ville,
        logoUrl: null,
        statut: 'EN_ATTENTE',
      };
      const createdUser = {
        id: 'user-002',
        email: registerPayload.email,
        nom: registerPayload.nom,
        organisationId: createdOrg.id,
        role: RoleUtilisateur.ADMINISTRATEUR,
      };
      txMock.organisation.create.mockResolvedValue(createdOrg);
      txMock.user.create.mockResolvedValue(createdUser);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerPayload)
        .expect(201);

      expect(response.body).not.toHaveProperty('accessToken');
      expect(response.body).not.toHaveProperty('user');
      expect(response.body.organisation).toEqual({ id: createdOrg.id, nom: createdOrg.nom, statut: 'EN_ATTENTE' });
      expect(typeof response.body.message).toBe('string');
    });

    it('retourne 409 si l\'email est déjà utilisé', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...registerPayload, organisationNom: 'Autre Entreprise' })
        .expect(409);
    });

    it('retourne 400 si le mot de passe est trop court', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...registerPayload, password: 'short' })
        .expect(400);
    });

    it('retourne 400 si un champ de revue obligatoire est absent (ville)', async () => {
      const { ville: _ville, ...sansVille } = registerPayload;
      await request(app.getHttpServer()).post('/auth/register').send(sansVille).expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('est accessible sans authentification (route publique)', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: 'Admin123!' })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        nom: mockUser.nom,
        avatarUrl: null,
        role: mockUser.role,
      });
    });

    it('retourne 401 pour un mot de passe incorrect', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: 'mauvais-mdp' })
        .expect(401);
    });

    it('retourne 400 si l\'email est invalide', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'pas-un-email', password: 'Admin123!' })
        .expect(400);
    });

    it('retourne 400 si le mot de passe est manquant', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email })
        .expect(400);
    });

    it("retourne 403 si l'organisation est en attente de validation", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        organisation: { statut: 'EN_ATTENTE' },
      });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: 'Admin123!' })
        .expect(403);

      expect(response.body.code).toBe('ORGANISATION_NON_VALIDEE');
    });
  });

  describe('Cookies de session (migration hors localStorage)', () => {
    it('pose les cookies access_token (httpOnly) et XSRF-TOKEN (lisible) à la connexion', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: 'Admin123!' })
        .expect(200);

      const setCookie = response.headers['set-cookie'] as unknown as string[];
      const accessTokenCookie = setCookie.find((c) => c.startsWith('access_token='));
      const csrfCookie = setCookie.find((c) => c.startsWith('XSRF-TOKEN='));

      expect(accessTokenCookie).toContain('HttpOnly');
      expect(csrfCookie).toBeDefined();
      expect(csrfCookie).not.toContain('HttpOnly');
    });

    it("authentifie une requête via le cookie access_token, sans en-tête Authorization", async () => {
      const { passwordHash: _unused, ...profile } = mockUser;
      prismaMock.user.findUnique.mockResolvedValue(profile);

      const token = jwtService.sign({
        sub: mockUser.id,
        email: mockUser.email,
        organisationId: mockUser.organisationId,
        role: mockUser.role,
      });

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', [`access_token=${token}`])
        .expect(200);

      expect(response.body).toMatchObject({ id: profile.id, email: profile.email });
    });

    it('POST /auth/logout efface les cookies de session', async () => {
      const response = await request(app.getHttpServer()).post('/auth/logout').expect(204);

      const setCookie = response.headers['set-cookie'] as unknown as string[];
      const accessTokenCookie = setCookie.find((c) => c.startsWith('access_token='));
      expect(accessTokenCookie).toMatch(/Expires=Thu, 01 Jan 1970/);
    });
  });

  describe('GET /auth/me', () => {
    it('retourne 401 sans token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('retourne 401 avec un token invalide', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer token-invalide')
        .expect(401);
    });

    it('retourne le profil avec un token valide', async () => {
      const { passwordHash: _unused, ...profile } = mockUser;
      prismaMock.user.findUnique.mockResolvedValue(profile);

      const token = jwtService.sign({
        sub: mockUser.id,
        email: mockUser.email,
        organisationId: mockUser.organisationId,
        role: mockUser.role,
      });

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: profile.id,
        email: profile.email,
        nom: profile.nom,
      });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: { id: true, email: true, nom: true, avatarUrl: true, role: true, createdAt: true },
      });
    });
  });

  describe('PATCH /auth/me', () => {
    it('retourne 401 sans token', async () => {
      await request(app.getHttpServer()).patch('/auth/me').send({ nom: 'Nouveau nom' }).expect(401);
    });

    it("met à jour l'avatar et le nom de l'utilisateur courant", async () => {
      const updated = { ...mockUser, nom: 'Nouveau nom', avatarUrl: 'https://example.com/avatar.png' };
      delete (updated as { passwordHash?: string }).passwordHash;
      prismaMock.user.update.mockResolvedValue(updated);

      const token = jwtService.sign({
        sub: mockUser.id,
        email: mockUser.email,
        organisationId: mockUser.organisationId,
        role: mockUser.role,
      });

      const response = await request(app.getHttpServer())
        .patch('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ nom: 'Nouveau nom', avatarUrl: 'https://example.com/avatar.png' })
        .expect(200);

      expect(response.body).toMatchObject({ nom: 'Nouveau nom', avatarUrl: 'https://example.com/avatar.png' });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { nom: 'Nouveau nom', avatarUrl: 'https://example.com/avatar.png' },
        select: { id: true, email: true, nom: true, avatarUrl: true, role: true, createdAt: true },
      });
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('est accessible sans authentification et répond toujours pareil, compte existant ou non', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const responseExistant = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: mockUser.email })
        .expect(200);

      prismaMock.user.findUnique.mockResolvedValue(null);

      const responseInconnu = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'inconnu@archivision.local' })
        .expect(200);

      expect(responseExistant.body.message).toBe(responseInconnu.body.message);
      expect(prismaMock.passwordResetToken.create).toHaveBeenCalledTimes(1);
    });

    it('retourne 400 si l\'email est invalide', async () => {
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'pas-un-email' })
        .expect(400);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('accepte un jeton valide, pose les cookies de session et retourne le profil', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        id: 'reset-1',
        userId: mockUser.id,
        tokenHash: 'peu-importe',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        user: mockUser,
      });

      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'un-jeton', password: 'NouveauMdp123!' })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      const setCookie = response.headers['set-cookie'] as unknown as string[];
      expect(setCookie.find((c) => c.startsWith('access_token='))).toContain('HttpOnly');
    });

    it('retourne 400 si le jeton est invalide ou expiré', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'inconnu', password: 'NouveauMdp123!' })
        .expect(400);
    });

    it('retourne 400 si le nouveau mot de passe est trop court', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'un-jeton', password: 'short' })
        .expect(400);
    });
  });
});
