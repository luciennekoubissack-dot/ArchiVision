import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { ConformiteController } from './conformite.controller';
import { ConformiteService } from './conformite.service';

describe('ConformiteController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockSolutionId = 'solution-001';

  const prismaMock = {
    solution: { count: jest.fn() },
    politiqueGouvernance: { count: jest.fn() },
    conformiteSolution: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
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
      controllers: [ConformiteController],
      providers: [ConformiteService],
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

  it('un Architecte peut lister toutes les conformités (200) — lecture ouverte', async () => {
    prismaMock.conformiteSolution.findMany.mockResolvedValue([]);
    await request(app.getHttpServer()).get('/conformites-solutions').expect(200);
  });

  it('un Architecte peut enregistrer les conformités d\'une solution (200)', async () => {
    prismaMock.solution.count.mockResolvedValue(1);
    prismaMock.politiqueGouvernance.count.mockResolvedValue(1);
    prismaMock.conformiteSolution.findMany.mockResolvedValue([]);

    await request(app.getHttpServer())
      .patch(`/conformites-solutions/${mockSolutionId}`)
      .send({ items: [{ politiqueId: '11111111-1111-4111-8111-111111111111', statut: 'CONFORME' }] })
      .expect(200);
  });

  it('un Superadmin reçoit 403 en tentant de modifier les conformités', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer())
      .patch(`/conformites-solutions/${mockSolutionId}`)
      .send({ items: [] })
      .expect(403);
  });
});
