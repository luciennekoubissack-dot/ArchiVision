import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { CritereEvaluationController } from './critere-evaluation.controller';
import { CritereEvaluationService } from './critere-evaluation.service';

describe('CritereEvaluationController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockCritere = { id: 'critere-001', nom: 'Coût', description: null, organisationId: 'org-001' };

  const prismaMock = {
    critereEvaluation: {
      create: jest.fn(),
      findMany: jest.fn(),
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
      imports: [PrismaModule],
      controllers: [CritereEvaluationController],
      providers: [CritereEvaluationService],
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

  it('un Architecte peut lister les critères (200) — lecture ouverte', async () => {
    prismaMock.critereEvaluation.findMany.mockResolvedValue([mockCritere]);

    const response = await request(app.getHttpServer()).get('/criteres-evaluation').expect(200);

    expect(response.body).toEqual([mockCritere]);
  });

  it('un Architecte peut créer un critère (201)', async () => {
    prismaMock.critereEvaluation.create.mockResolvedValue(mockCritere);

    const response = await request(app.getHttpServer())
      .post('/criteres-evaluation')
      .send({ nom: mockCritere.nom })
      .expect(201);

    expect(response.body.nom).toBe(mockCritere.nom);
  });

  it('un Superadmin reçoit 403 en tentant de créer un critère', async () => {
    currentUser = superadmin;

    await request(app.getHttpServer()).post('/criteres-evaluation').send({ nom: 'X' }).expect(403);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer un critère', async () => {
    currentUser = superadmin;

    await request(app.getHttpServer()).delete(`/criteres-evaluation/${mockCritere.id}`).expect(403);
  });
});
