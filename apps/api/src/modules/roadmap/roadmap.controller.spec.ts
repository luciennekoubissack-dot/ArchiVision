import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { RoadmapController } from './roadmap.controller';
import { RoadmapService } from './roadmap.service';

describe('RoadmapController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockProjet = {
    id: 'projet-001',
    nom: 'Migration ERP',
    description: null,
    priorite: 'HAUTE',
    coutEstime: '50000€',
    statut: 'PLANIFIE',
    organisationId: 'org-001',
  };

  const prismaMock = {
    projet: {
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
      imports: [PrismaModule],
      controllers: [RoadmapController],
      providers: [RoadmapService],
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

  it('un Architecte peut lister les projets (200) : lecture ouverte', async () => {
    prismaMock.projet.findMany.mockResolvedValue([mockProjet]);
    const response = await request(app.getHttpServer()).get('/projets').expect(200);
    expect(response.body).toEqual([mockProjet]);
  });

  it('un Architecte peut consulter un projet par son identifiant (200)', async () => {
    prismaMock.projet.findUnique.mockResolvedValue(mockProjet);
    const response = await request(app.getHttpServer()).get(`/projets/${mockProjet.id}`).expect(200);
    expect(response.body.id).toBe(mockProjet.id);
  });

  it('un Architecte peut créer un projet (201)', async () => {
    prismaMock.projet.create.mockResolvedValue(mockProjet);
    const response = await request(app.getHttpServer())
      .post('/projets')
      .send({ nom: mockProjet.nom })
      .expect(201);
    expect(response.body.nom).toBe(mockProjet.nom);
  });

  it('un Architecte peut mettre à jour un projet (200)', async () => {
    prismaMock.projet.count.mockResolvedValue(1);
    prismaMock.projet.update.mockResolvedValue({ ...mockProjet, statut: 'EN_COURS' });
    const response = await request(app.getHttpServer())
      .patch(`/projets/${mockProjet.id}`)
      .send({ statut: 'EN_COURS' })
      .expect(200);
    expect(response.body.statut).toBe('EN_COURS');
  });

  it('un Architecte peut supprimer un projet (204)', async () => {
    prismaMock.projet.count.mockResolvedValue(1);
    prismaMock.projet.delete.mockResolvedValue(mockProjet);
    await request(app.getHttpServer()).delete(`/projets/${mockProjet.id}`).expect(204);
  });

  it('un Superadmin reçoit 403 en tentant de créer un projet', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).post('/projets').send({ nom: 'X' }).expect(403);
  });

  it('un Superadmin reçoit 403 en tentant de mettre à jour un projet', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).patch(`/projets/${mockProjet.id}`).send({ nom: 'X' }).expect(403);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer un projet', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).delete(`/projets/${mockProjet.id}`).expect(403);
  });
});
