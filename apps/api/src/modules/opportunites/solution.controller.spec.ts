import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { SolutionController } from './solution.controller';
import { SolutionService } from './solution.service';

describe('SolutionController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockSolution = {
    id: 'solution-001',
    nom: 'Migrer vers un ERP cloud',
    description: null,
    statut: 'PROPOSEE',
    organisationId: 'org-001',
  };

  const prismaMock = {
    solution: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    critereEvaluation: { count: jest.fn() },
    evaluationScore: { upsert: jest.fn() },
    solutionGap: { deleteMany: jest.fn(), createMany: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
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
      controllers: [SolutionController],
      providers: [SolutionService],
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

  it('un Architecte peut lister les solutions (200) — lecture ouverte', async () => {
    prismaMock.solution.findMany.mockResolvedValue([mockSolution]);

    const response = await request(app.getHttpServer()).get('/solutions').expect(200);

    expect(response.body).toEqual([mockSolution]);
  });

  it('un Architecte peut créer une solution (201)', async () => {
    prismaMock.solution.create.mockResolvedValue(mockSolution);

    const response = await request(app.getHttpServer())
      .post('/solutions')
      .send({ nom: mockSolution.nom })
      .expect(201);

    expect(response.body.nom).toBe(mockSolution.nom);
  });

  it('un Architecte peut enregistrer les notes d\'une solution (200)', async () => {
    prismaMock.solution.count.mockResolvedValue(1);
    prismaMock.critereEvaluation.count.mockResolvedValue(1);
    prismaMock.solution.findUnique.mockResolvedValue({ ...mockSolution, scores: [] });

    await request(app.getHttpServer())
      .patch(`/solutions/${mockSolution.id}/scores`)
      .send({ items: [{ critereId: '11111111-1111-4111-8111-111111111111', score: 4 }] })
      .expect(200);
  });

  it('un Architecte peut mettre à jour les écarts adressés par une solution (200)', async () => {
    prismaMock.solution.count.mockResolvedValue(1);
    prismaMock.solution.findUnique.mockResolvedValue({ ...mockSolution, gaps: [] });

    await request(app.getHttpServer())
      .patch(`/solutions/${mockSolution.id}/gaps`)
      .send({ items: [{ domaine: 'OBJECTIF', elementId: 'objectif-001', elementNom: 'Digitaliser la gestion' }] })
      .expect(200);

    expect(prismaMock.solutionGap.deleteMany).toHaveBeenCalledWith({ where: { solutionId: mockSolution.id } });
  });

  it('un Architecte peut lister tous les écarts adressés (200), route "gaps" non masquée par ":id"', async () => {
    prismaMock.solutionGap.findMany.mockResolvedValue([]);

    const response = await request(app.getHttpServer()).get('/solutions/gaps').expect(200);

    expect(response.body).toEqual([]);
    expect(prismaMock.solution.findUnique).not.toHaveBeenCalled();
  });

  it('un Superadmin reçoit 403 en tentant de créer une solution', async () => {
    currentUser = superadmin;

    await request(app.getHttpServer()).post('/solutions').send({ nom: 'X' }).expect(403);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer une solution', async () => {
    currentUser = superadmin;

    await request(app.getHttpServer()).delete(`/solutions/${mockSolution.id}`).expect(403);
  });
});
