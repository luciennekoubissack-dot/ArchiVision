import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { OrganisationModule } from './organisation.module';

describe('OrganisationController (HTTP)', () => {
  let app: INestApplication;

  const mockUser = {
    sub: 'user-001',
    email: 'admin@archivision.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ADMINISTRATEUR,
  };

  const mockOrganisation = {
    id: 'org-001',
    nom: 'K&B Groupe SARL',
    description: 'Organisation de test',
    logoUrl: null,
    secteur: null,
    taille: null,
    pays: null,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    organisation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    capaciteMetier: { findMany: jest.fn().mockResolvedValue([]) },
    elementArchimate: { findMany: jest.fn().mockResolvedValue([]) },
    relationArchimate: { findMany: jest.fn().mockResolvedValue([]) },
    application: { findMany: jest.fn().mockResolvedValue([]) },
    zoneUrbanisation: { findMany: jest.fn().mockResolvedValue([]) },
  };

  // Simule le JwtAuthGuard global : injecte l'utilisateur authentifié dans
  // la requête sans passer par un vrai JWT (RolesGuard, lui, reste réel).
  const fakeAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = mockUser;
      return true;
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, OrganisationModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalGuards(fakeAuthGuard);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /organisations/me', () => {
    it("retourne l'organisation de l'utilisateur connecté (200)", async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(mockOrganisation);

      const response = await request(app.getHttpServer())
        .get('/organisations/me')
        .expect(200);

      expect(response.body.id).toBe(mockOrganisation.id);
    });

    it('retourne 404 si introuvable', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer()).get('/organisations/me').expect(404);
    });
  });

  describe('PATCH /organisations/me', () => {
    it("met à jour l'organisation (200) pour un Administrateur", async () => {
      const updated = { ...mockOrganisation, description: 'Description mise à jour' };
      prismaMock.organisation.findUnique.mockResolvedValue(mockOrganisation);
      prismaMock.organisation.update.mockResolvedValue(updated);

      const response = await request(app.getHttpServer())
        .patch('/organisations/me')
        .send({ description: updated.description })
        .expect(200);

      expect(response.body.description).toBe(updated.description);
    });

    it('retourne 404 si introuvable', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/organisations/me')
        .send({ nom: 'Test' })
        .expect(404);
    });
  });

  describe('GET /organisations/me/export', () => {
    it('retourne un export JSON du référentiel (200)', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(mockOrganisation);

      const response = await request(app.getHttpServer())
        .get('/organisations/me/export')
        .expect(200);

      expect(response.body.organisation.id).toBe(mockOrganisation.id);
      expect(response.body).toHaveProperty('capacites');
      expect(response.body).toHaveProperty('elements');
      expect(response.body).toHaveProperty('applications');
      expect(response.body).toHaveProperty('zones');
    });
  });
});
