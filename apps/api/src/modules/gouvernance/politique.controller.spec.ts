import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { PolitiqueController } from './politique.controller';
import { PolitiqueService } from './politique.service';

describe('PolitiqueController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockPolitique = { id: 'politique-001', nom: 'Chiffrement des données au repos', description: null, organisationId: 'org-001' };

  const prismaMock = {
    politiqueGouvernance: {
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
      controllers: [PolitiqueController],
      providers: [PolitiqueService],
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

  it('un Architecte peut lister les politiques (200) — lecture ouverte', async () => {
    prismaMock.politiqueGouvernance.findMany.mockResolvedValue([mockPolitique]);
    const response = await request(app.getHttpServer()).get('/politiques-gouvernance').expect(200);
    expect(response.body).toEqual([mockPolitique]);
  });

  it('un Architecte peut créer une politique (201)', async () => {
    prismaMock.politiqueGouvernance.create.mockResolvedValue(mockPolitique);
    const response = await request(app.getHttpServer())
      .post('/politiques-gouvernance')
      .send({ nom: mockPolitique.nom })
      .expect(201);
    expect(response.body.nom).toBe(mockPolitique.nom);
  });

  it('un Superadmin reçoit 403 en tentant de créer une politique', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).post('/politiques-gouvernance').send({ nom: 'X' }).expect(403);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer une politique', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).delete(`/politiques-gouvernance/${mockPolitique.id}`).expect(403);
  });
});
