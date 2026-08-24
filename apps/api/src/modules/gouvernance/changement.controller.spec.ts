import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { ChangementController } from './changement.controller';
import { ChangementService } from './changement.service';

describe('ChangementController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockChangement = { id: 'changement-001', titre: 'Migrer vers TLS 1.3', description: null, statut: 'PROPOSE', organisationId: 'org-001' };

  const prismaMock = {
    demandeChangement: {
      create: jest.fn(),
      findMany: jest.fn(),
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
      imports: [PrismaModule],
      controllers: [ChangementController],
      providers: [ChangementService],
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

  it('un Architecte peut lister les demandes de changement (200) — lecture ouverte', async () => {
    prismaMock.demandeChangement.findMany.mockResolvedValue([mockChangement]);
    const response = await request(app.getHttpServer()).get('/demandes-changement').expect(200);
    expect(response.body).toEqual([mockChangement]);
  });

  it('un Architecte peut créer une demande de changement (201)', async () => {
    prismaMock.demandeChangement.create.mockResolvedValue(mockChangement);
    const response = await request(app.getHttpServer())
      .post('/demandes-changement')
      .send({ titre: mockChangement.titre })
      .expect(201);
    expect(response.body.titre).toBe(mockChangement.titre);
  });

  it('un Superadmin reçoit 403 en tentant de créer une demande de changement', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).post('/demandes-changement').send({ titre: 'X' }).expect(403);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer une demande de changement', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).delete(`/demandes-changement/${mockChangement.id}`).expect(403);
  });
});
