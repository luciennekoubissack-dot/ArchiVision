import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { ObjectifModule } from './objectif.module';

describe('ObjectifController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  // Un superadmin n'est rattaché à aucune organisation — sert ici à démontrer
  // que le RolesGuard bloque bien les rôles hors ADMINISTRATEUR/ARCHITECTE.
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockObjectif = {
    id: 'objectif-001',
    nom: 'Digitaliser la gestion administrative',
    description: null,
    organisationId: 'org-001',
  };

  const prismaMock = {
    objectif: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
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
      imports: [PrismaModule, ObjectifModule],
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

  it('un Architecte peut lister les objectifs (200) — lecture ouverte', async () => {
    prismaMock.objectif.findMany.mockResolvedValue([mockObjectif]);

    const response = await request(app.getHttpServer()).get('/objectifs').expect(200);

    expect(response.body).toEqual([mockObjectif]);
  });

  it('un Architecte peut créer un objectif (201)', async () => {
    prismaMock.objectif.create.mockResolvedValue(mockObjectif);

    const response = await request(app.getHttpServer())
      .post('/objectifs')
      .send({ nom: mockObjectif.nom })
      .expect(201);

    expect(response.body.nom).toBe(mockObjectif.nom);
  });

  it('un Architecte peut créer un objectif TO-BE relié à un objectif AS-IS (201)', async () => {
    const asIs = { ...mockObjectif, id: '22222222-2222-2222-8222-222222222222', statut: 'AS_IS' };
    prismaMock.objectif.findUnique.mockResolvedValue(asIs);
    prismaMock.objectif.create.mockResolvedValue({ ...mockObjectif, statut: 'TO_BE', objectifAsIsId: asIs.id });

    const response = await request(app.getHttpServer())
      .post('/objectifs')
      .send({ nom: 'Gestion numérique', statut: 'TO_BE', objectifAsIsId: asIs.id })
      .expect(201);

    expect(response.body.objectifAsIsId).toBe(asIs.id);
  });

  it('un Architecte reçoit 400 si l\'objectif AS-IS d\'origine est introuvable', async () => {
    prismaMock.objectif.findUnique.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post('/objectifs')
      .send({ nom: 'X', statut: 'TO_BE', objectifAsIsId: '11111111-1111-1111-8111-111111111111' })
      .expect(400);
  });

  it('un Superadmin reçoit 403 en tentant de créer un objectif', async () => {
    currentUser = superadmin;

    await request(app.getHttpServer()).post('/objectifs').send({ nom: 'X' }).expect(403);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer un objectif', async () => {
    currentUser = superadmin;

    await request(app.getHttpServer()).delete(`/objectifs/${mockObjectif.id}`).expect(403);
  });
});
