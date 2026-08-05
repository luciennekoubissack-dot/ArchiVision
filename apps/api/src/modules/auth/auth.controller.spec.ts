import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
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
    role: RoleUtilisateur.ARCHITECTE,
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
    },
    $transaction: jest.fn((callback: (tx: typeof txMock) => unknown) => callback(txMock)),
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('Admin123!', 4);
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), AuthModule],
      providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
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
    it('est accessible sans authentification et crée une organisation + un Architecte', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const createdOrg = { id: 'org-002', nom: 'Nouvelle Entreprise', description: null, secteur: null, taille: null, pays: null, logoUrl: null };
      const createdUser = {
        id: 'user-002',
        email: 'fondateur@nouvelle-entreprise.local',
        nom: 'Fondateur',
        organisationId: createdOrg.id,
        role: RoleUtilisateur.ARCHITECTE,
      };
      txMock.organisation.create.mockResolvedValue(createdOrg);
      txMock.user.create.mockResolvedValue(createdUser);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          organisationNom: createdOrg.nom,
          email: createdUser.email,
          password: 'MotDePasse123!',
          nom: createdUser.nom,
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.role).toBe(RoleUtilisateur.ARCHITECTE);
      expect(response.body.organisation.id).toBe(createdOrg.id);
    });

    it('retourne 409 si l\'email est déjà utilisé', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          organisationNom: 'Autre Entreprise',
          email: mockUser.email,
          password: 'MotDePasse123!',
          nom: 'Quelqu\'un',
        })
        .expect(409);
    });

    it('retourne 400 si le mot de passe est trop court', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ organisationNom: 'X', email: 'x@x.local', password: 'short', nom: 'X' })
        .expect(400);
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
        select: { id: true, email: true, nom: true, role: true, createdAt: true },
      });
    });
  });
});
