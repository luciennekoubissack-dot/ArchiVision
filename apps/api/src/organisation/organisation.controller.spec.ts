import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { OrganisationModule } from './organisation.module';

describe('OrganisationController (HTTP)', () => {
  let app: INestApplication;

  const mockOrganisation = {
    id: 'org-001',
    nom: 'K&B Groupe SARL',
    description: 'Organisation de test',
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    organisation: {
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, OrganisationModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(APP_GUARD)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
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

  describe('POST /organisations', () => {
    it('crée une organisation (201)', async () => {
      prismaMock.organisation.create.mockResolvedValue(mockOrganisation);

      const response = await request(app.getHttpServer())
        .post('/organisations')
        .send({ nom: mockOrganisation.nom, description: mockOrganisation.description })
        .expect(201);

      expect(response.body).toMatchObject({
        id: mockOrganisation.id,
        nom: mockOrganisation.nom,
        description: mockOrganisation.description,
      });
    });

    it('rejette un nom vide (400)', async () => {
      await request(app.getHttpServer())
        .post('/organisations')
        .send({ nom: '' })
        .expect(400);
    });

    it('rejette un champ non autorisé (400)', async () => {
      await request(app.getHttpServer())
        .post('/organisations')
        .send({ nom: 'Test', extra: 'invalid' })
        .expect(400);
    });
  });

  describe('GET /organisations', () => {
    it('retourne la liste (200)', async () => {
      prismaMock.organisation.findMany.mockResolvedValue([mockOrganisation]);

      const response = await request(app.getHttpServer())
        .get('/organisations')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].nom).toBe(mockOrganisation.nom);
    });
  });

  describe('GET /organisations/:id', () => {
    it('retourne une organisation (200)', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(mockOrganisation);

      const response = await request(app.getHttpServer())
        .get(`/organisations/${mockOrganisation.id}`)
        .expect(200);

      expect(response.body.id).toBe(mockOrganisation.id);
    });

    it('retourne 404 si introuvable', async () => {
      prismaMock.organisation.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/organisations/inconnue')
        .expect(404);
    });
  });

  describe('PATCH /organisations/:id', () => {
    it('met à jour une organisation (200)', async () => {
      const updated = { ...mockOrganisation, description: 'Description mise à jour' };
      prismaMock.organisation.count.mockResolvedValue(1);
      prismaMock.organisation.update.mockResolvedValue(updated);

      const response = await request(app.getHttpServer())
        .patch(`/organisations/${mockOrganisation.id}`)
        .send({ description: updated.description })
        .expect(200);

      expect(response.body.description).toBe(updated.description);
    });

    it('retourne 404 si introuvable', async () => {
      prismaMock.organisation.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .patch('/organisations/inconnue')
        .send({ nom: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /organisations/:id', () => {
    it('supprime une organisation (204)', async () => {
      prismaMock.organisation.count.mockResolvedValue(1);
      prismaMock.organisation.delete.mockResolvedValue(mockOrganisation);

      await request(app.getHttpServer())
        .delete(`/organisations/${mockOrganisation.id}`)
        .expect(204);
    });

    it('retourne 404 si introuvable', async () => {
      prismaMock.organisation.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .delete('/organisations/inconnue')
        .expect(404);
    });
  });
});
