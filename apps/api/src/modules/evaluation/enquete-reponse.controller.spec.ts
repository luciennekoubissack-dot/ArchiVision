import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { EnqueteReponseController } from './enquete-reponse.controller';
import { EnqueteReponseService } from './enquete-reponse.service';

describe('EnqueteReponseController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockReponse = { id: 'reponse-001', repondant: 'Directeur commercial', score: 4, commentaire: null, organisationId: 'org-001' };

  const prismaMock = {
    enqueteReponse: {
      createMany: jest.fn(),
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
      controllers: [EnqueteReponseController],
      providers: [EnqueteReponseService],
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

  it('un Architecte peut lister les réponses (200) — lecture ouverte', async () => {
    prismaMock.enqueteReponse.findMany.mockResolvedValue([mockReponse]);
    const response = await request(app.getHttpServer()).get('/enquete-reponses').expect(200);
    expect(response.body).toEqual([mockReponse]);
  });

  it('un Architecte peut importer des réponses (201)', async () => {
    prismaMock.enqueteReponse.createMany.mockResolvedValue({ count: 1 });
    prismaMock.enqueteReponse.findMany.mockResolvedValue([mockReponse]);

    await request(app.getHttpServer())
      .post('/enquete-reponses/import')
      .send({ items: [{ repondant: mockReponse.repondant, score: mockReponse.score }] })
      .expect(201);
  });

  it('un Superadmin reçoit 403 en tentant d\'importer des réponses', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer())
      .post('/enquete-reponses/import')
      .send({ items: [] })
      .expect(403);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer une réponse', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).delete(`/enquete-reponses/${mockReponse.id}`).expect(403);
  });
});
