import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { ElementKind, RoleUtilisateur, TypeRelation } from '@prisma/client';
import { CanevasController } from './canevas.controller';
import { CanevasService } from './canevas.service';

describe('CanevasController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockRelation = {
    id: 'canevas-rel-001',
    type: TypeRelation.REALISATION,
    sourceKind: ElementKind.APPLICATION,
    sourceId: 'app-001',
    targetKind: ElementKind.ARCHIMATE,
    targetId: 'elem-001',
    organisationId: 'org-001',
  };

  const prismaMock = {
    elementArchimate: { count: jest.fn() },
    application: { count: jest.fn() },
    techComponent: { count: jest.fn() },
    dataEntity: { count: jest.fn() },
    canevasRelation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
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
      imports: [PrismaModule],
      controllers: [CanevasController],
      providers: [CanevasService],
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

  it('un Architecte peut lister les relations du canevas (200)', async () => {
    prismaMock.canevasRelation.findMany.mockResolvedValue([mockRelation]);
    const response = await request(app.getHttpServer()).get('/canevas-relations').expect(200);
    expect(response.body).toEqual([mockRelation]);
  });

  it('un Architecte peut créer une relation entre deux éléments du canevas (201)', async () => {
    prismaMock.application.count.mockResolvedValue(1);
    prismaMock.elementArchimate.count.mockResolvedValue(1);
    prismaMock.canevasRelation.create.mockResolvedValue(mockRelation);

    const response = await request(app.getHttpServer())
      .post('/canevas-relations')
      .send({
        type: TypeRelation.REALISATION,
        sourceKind: ElementKind.APPLICATION,
        sourceId: 'app-001',
        targetKind: ElementKind.ARCHIMATE,
        targetId: 'elem-001',
      })
      .expect(201);
    expect(response.body).toEqual(mockRelation);
  });

  it('une création avec une source et une cible identiques reçoit 400', async () => {
    await request(app.getHttpServer())
      .post('/canevas-relations')
      .send({
        type: TypeRelation.ASSOCIATION,
        sourceKind: ElementKind.APPLICATION,
        sourceId: 'app-001',
        targetKind: ElementKind.APPLICATION,
        targetId: 'app-001',
      })
      .expect(400);
    expect(prismaMock.canevasRelation.create).not.toHaveBeenCalled();
  });

  it('un Architecte peut supprimer une relation du canevas (204)', async () => {
    prismaMock.canevasRelation.findUnique.mockResolvedValue(mockRelation);
    prismaMock.canevasRelation.delete.mockResolvedValue(mockRelation);
    await request(app.getHttpServer()).delete(`/canevas-relations/${mockRelation.id}`).expect(204);
  });

  it('la suppression d\'une relation introuvable reçoit 404', async () => {
    prismaMock.canevasRelation.findUnique.mockResolvedValue(null);
    await request(app.getHttpServer()).delete('/canevas-relations/inconnue').expect(404);
  });

  it('un Superadmin (sans organisation) reçoit 403 : compte non rattaché à une organisation', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).get('/canevas-relations').expect(403);
  });
});
