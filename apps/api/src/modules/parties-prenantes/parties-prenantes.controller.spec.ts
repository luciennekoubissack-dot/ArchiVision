import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { PartiesPrenantesController } from './parties-prenantes.controller';
import { PartiesPrenantesService } from './parties-prenantes.service';

describe('PartiesPrenantesController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockPartie = { id: 'pp-001', nom: 'Client principal', role: 'Client', organisationId: 'org-001' };

  const prismaMock = {
    partiePrenante: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
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
      controllers: [PartiesPrenantesController],
      providers: [PartiesPrenantesService],
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

  it('un Architecte peut lister les parties prenantes (200)', async () => {
    prismaMock.partiePrenante.findMany.mockResolvedValue([mockPartie]);
    const response = await request(app.getHttpServer()).get('/parties-prenantes').expect(200);
    expect(response.body).toEqual([mockPartie]);
  });

  it('un Architecte peut créer une partie prenante (201)', async () => {
    prismaMock.partiePrenante.create.mockResolvedValue(mockPartie);
    const response = await request(app.getHttpServer())
      .post('/parties-prenantes')
      .send({ nom: mockPartie.nom, role: mockPartie.role })
      .expect(201);
    expect(response.body).toEqual(mockPartie);
  });

  it('un Superadmin reçoit 403 en tentant de créer une partie prenante', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).post('/parties-prenantes').send({ nom: 'X' }).expect(403);
  });

  it('un Architecte peut supprimer une partie prenante (204)', async () => {
    prismaMock.partiePrenante.count.mockResolvedValue(1);
    prismaMock.partiePrenante.delete.mockResolvedValue(mockPartie);
    await request(app.getHttpServer()).delete(`/parties-prenantes/${mockPartie.id}`).expect(204);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer une partie prenante', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).delete(`/parties-prenantes/${mockPartie.id}`).expect(403);
  });

  it('la suppression d\'une partie prenante introuvable reçoit 404', async () => {
    prismaMock.partiePrenante.count.mockResolvedValue(0);
    await request(app.getHttpServer()).delete('/parties-prenantes/inconnu').expect(404);
  });
});
