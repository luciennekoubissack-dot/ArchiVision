import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur, TypeElement, TypeRelation } from '@prisma/client';
import { ArchimateController } from './archimate.controller';
import { ArchimateService } from './archimate.service';
import { ArchimateViewService } from './archimate-view.service';
import { ArchimateLayoutService } from './archimate-layout.service';

describe('ArchimateController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockCapacite = {
    id: 'cap-001',
    nom: 'Gestion des formations',
    description: null,
    organisationId: 'org-001',
  };

  const mockElement = {
    id: 'elem-001',
    nom: 'Formateur',
    type: TypeElement.ACTEUR_METIER,
    description: null,
    organisationId: 'org-001',
    capaciteMetierId: null,
  };

  const mockRelation = {
    id: 'rel-001',
    type: TypeRelation.ASSIGNATION,
    sourceId: 'elem-001',
    targetId: 'elem-002',
  };

  const ELEMENT_ID = '11111111-1111-1111-8111-111111111111';
  const ELEMENT_CIBLE_ID = '22222222-2222-2222-8222-222222222222';

  const prismaMock = {
    capaciteMetier: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    elementArchimate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    relationArchimate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
  };

  const fakeAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      context.switchToHttp().getRequest().user = currentUser;
      return true;
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    currentUser = architecte;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      controllers: [ArchimateController],
      providers: [ArchimateService, ArchimateViewService, ArchimateLayoutService],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalGuards(fakeAuthGuard);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  // ── Capacités métier ──────────────────────────────────────────────────────

  it('un Architecte peut créer une capacité métier (201)', async () => {
    prismaMock.capaciteMetier.create.mockResolvedValue(mockCapacite);
    const response = await request(app.getHttpServer())
      .post('/capacites-metier')
      .send({ nom: mockCapacite.nom })
      .expect(201);
    expect(response.body).toEqual(mockCapacite);
  });

  it('un Architecte peut lister les capacités métier (200)', async () => {
    prismaMock.capaciteMetier.findMany.mockResolvedValue([mockCapacite]);
    const response = await request(app.getHttpServer()).get('/capacites-metier').expect(200);
    expect(response.body).toEqual([mockCapacite]);
  });

  it('un Architecte peut consulter une capacité métier par identifiant (200)', async () => {
    prismaMock.capaciteMetier.findUnique.mockResolvedValue(mockCapacite);
    const response = await request(app.getHttpServer()).get(`/capacites-metier/${mockCapacite.id}`).expect(200);
    expect(response.body).toEqual(mockCapacite);
  });

  it('un Architecte peut mettre à jour une capacité métier (200)', async () => {
    prismaMock.capaciteMetier.count.mockResolvedValue(1);
    prismaMock.capaciteMetier.update.mockResolvedValue({ ...mockCapacite, nom: 'Nouveau nom' });
    const response = await request(app.getHttpServer())
      .patch(`/capacites-metier/${mockCapacite.id}`)
      .send({ nom: 'Nouveau nom' })
      .expect(200);
    expect(response.body.nom).toBe('Nouveau nom');
  });

  it('un Architecte peut supprimer une capacité métier (204)', async () => {
    prismaMock.capaciteMetier.count.mockResolvedValue(1);
    prismaMock.capaciteMetier.delete.mockResolvedValue(mockCapacite);
    await request(app.getHttpServer()).delete(`/capacites-metier/${mockCapacite.id}`).expect(204);
  });

  // ── Éléments ArchiMate ────────────────────────────────────────────────────

  it('un Architecte peut créer un élément ArchiMate (201)', async () => {
    prismaMock.elementArchimate.create.mockResolvedValue(mockElement);
    const response = await request(app.getHttpServer())
      .post('/elements-archimate')
      .send({ nom: mockElement.nom, type: mockElement.type })
      .expect(201);
    expect(response.body).toEqual(mockElement);
  });

  it('un Architecte peut lister les éléments ArchiMate (200)', async () => {
    prismaMock.elementArchimate.findMany.mockResolvedValue([mockElement]);
    const response = await request(app.getHttpServer()).get('/elements-archimate').expect(200);
    expect(response.body).toEqual([mockElement]);
  });

  it('un Architecte peut générer la vue ArchiMate (200)', async () => {
    prismaMock.elementArchimate.findMany.mockResolvedValue([]);
    prismaMock.relationArchimate.findMany.mockResolvedValue([]);
    const response = await request(app.getHttpServer()).get('/elements-archimate/generate-vue').expect(200);
    expect(response.body.elementCount).toBe(0);
    expect(response.body.relationCount).toBe(0);
    expect(typeof response.body.svg).toBe('string');
  });

  it('un Architecte peut générer et enregistrer la disposition automatique (200)', async () => {
    prismaMock.elementArchimate.findMany.mockResolvedValue([]);
    const response = await request(app.getHttpServer()).post('/elements-archimate/generate-layout').expect(200);
    expect(response.body).toEqual({ elements: [], elementCount: 0 });
  });

  it('un Architecte peut mettre à jour les positions de plusieurs éléments en lot (200)', async () => {
    prismaMock.elementArchimate.count.mockResolvedValue(2);
    prismaMock.elementArchimate.update
      .mockResolvedValueOnce({ ...mockElement, id: ELEMENT_ID, positionX: 10, positionY: 20 })
      .mockResolvedValueOnce({ ...mockElement, id: ELEMENT_CIBLE_ID, positionX: 30, positionY: 40 });
    const response = await request(app.getHttpServer())
      .patch('/elements-archimate/positions')
      .send({
        items: [
          { id: ELEMENT_ID, positionX: 10, positionY: 20 },
          { id: ELEMENT_CIBLE_ID, positionX: 30, positionY: 40 },
        ],
      })
      .expect(200);
    expect(response.body).toHaveLength(2);
  });

  it('un Architecte peut consulter un élément ArchiMate par identifiant (200)', async () => {
    prismaMock.elementArchimate.findUnique.mockResolvedValue(mockElement);
    const response = await request(app.getHttpServer()).get(`/elements-archimate/${mockElement.id}`).expect(200);
    expect(response.body).toEqual(mockElement);
  });

  it('un Architecte peut mettre à jour un élément ArchiMate (200)', async () => {
    prismaMock.elementArchimate.count.mockResolvedValue(1);
    prismaMock.elementArchimate.update.mockResolvedValue({ ...mockElement, nom: 'Nouveau nom' });
    const response = await request(app.getHttpServer())
      .patch(`/elements-archimate/${mockElement.id}`)
      .send({ nom: 'Nouveau nom' })
      .expect(200);
    expect(response.body.nom).toBe('Nouveau nom');
  });

  it("un Architecte peut mettre à jour la position d'un élément ArchiMate (200)", async () => {
    prismaMock.elementArchimate.count.mockResolvedValue(1);
    prismaMock.elementArchimate.update.mockResolvedValue({ ...mockElement, positionX: 100, positionY: 200 });
    const response = await request(app.getHttpServer())
      .patch(`/elements-archimate/${mockElement.id}/position`)
      .send({ positionX: 100, positionY: 200 })
      .expect(200);
    expect(response.body.positionX).toBe(100);
  });

  it('un Architecte peut supprimer un élément ArchiMate (204)', async () => {
    prismaMock.elementArchimate.count.mockResolvedValue(1);
    prismaMock.elementArchimate.delete.mockResolvedValue(mockElement);
    await request(app.getHttpServer()).delete(`/elements-archimate/${mockElement.id}`).expect(204);
  });

  // ── Relations ArchiMate ───────────────────────────────────────────────────

  it('un Architecte peut créer une relation entre deux éléments ArchiMate (201)', async () => {
    prismaMock.elementArchimate.count.mockResolvedValue(1);
    prismaMock.relationArchimate.create.mockResolvedValue(mockRelation);
    const response = await request(app.getHttpServer())
      .post('/relations-archimate')
      .send({ type: TypeRelation.ASSIGNATION, sourceId: ELEMENT_ID, targetId: ELEMENT_CIBLE_ID })
      .expect(201);
    expect(response.body).toEqual(mockRelation);
  });

  it('un Architecte peut lister les relations ArchiMate (200)', async () => {
    prismaMock.relationArchimate.findMany.mockResolvedValue([mockRelation]);
    const response = await request(app.getHttpServer()).get('/relations-archimate').expect(200);
    expect(response.body).toEqual([mockRelation]);
  });

  it('un Architecte peut supprimer une relation ArchiMate (204)', async () => {
    prismaMock.relationArchimate.findUnique.mockResolvedValue({
      ...mockRelation,
      source: { organisationId: 'org-001' },
    });
    prismaMock.relationArchimate.delete.mockResolvedValue(mockRelation);
    await request(app.getHttpServer()).delete(`/relations-archimate/${mockRelation.id}`).expect(204);
  });

  // ── Accès superadmin ──────────────────────────────────────────────────────
  // Aucun @Roles n'est appliqué sur ce contrôleur : la seule barrière restante
  // est requireOrganisationId, qui rejette tout appelant sans organisationId
  // (cas du Superadmin) avant même d'atteindre le service.

  it('un Superadmin sans organisation reçoit 403 (requireOrganisationId)', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).get('/capacites-metier').expect(403);
  });
});
