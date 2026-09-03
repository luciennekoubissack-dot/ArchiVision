import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { ServiceViewService } from './service-view.service';

describe('ServiceController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  // Un superadmin n'est rattaché à aucune organisation : requireOrganisationId()
  // lève un ForbiddenException (403) avant même d'atteindre le service.
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockService = {
    id: 'service-001',
    nom: 'Direction Générale',
    description: null,
    parentId: null,
    organisationId: 'org-001',
  };

  const TITULAIRE_ID = '33333333-3333-4333-8333-333333333333';

  const prismaMock = {
    service: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
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
      controllers: [ServiceController],
      providers: [ServiceService, ServiceViewService],
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

  it('un Architecte peut lister les services (200) : lecture ouverte', async () => {
    prismaMock.service.findMany.mockResolvedValue([mockService]);
    const response = await request(app.getHttpServer()).get('/services').expect(200);
    expect(response.body).toEqual([mockService]);
  });

  it('un Architecte peut générer la vue de l\'organigramme (200)', async () => {
    prismaMock.service.findMany.mockResolvedValue([{ ...mockService, membres: [], enfants: [] }]);
    const response = await request(app.getHttpServer()).get('/services/generate-vue').expect(200);
    expect(response.body.serviceCount).toBe(1);
    expect(response.body.svg).toContain('Direction Générale');
  });

  it('un Architecte peut consulter un service par son identifiant (200)', async () => {
    prismaMock.service.findUnique.mockResolvedValue({ ...mockService, parent: null, enfants: [], membres: [] });
    const response = await request(app.getHttpServer()).get(`/services/${mockService.id}`).expect(200);
    expect(response.body.id).toBe(mockService.id);
  });

  it('un Architecte peut créer un service (201)', async () => {
    prismaMock.service.create.mockResolvedValue(mockService);
    const response = await request(app.getHttpServer())
      .post('/services')
      .send({ nom: mockService.nom })
      .expect(201);
    expect(response.body.nom).toBe(mockService.nom);
  });

  it('un Architecte peut mettre à jour un service (200)', async () => {
    prismaMock.service.count.mockResolvedValue(1);
    prismaMock.service.update.mockResolvedValue({ ...mockService, nom: 'Direction Financière' });
    const response = await request(app.getHttpServer())
      .patch(`/services/${mockService.id}`)
      .send({ nom: 'Direction Financière' })
      .expect(200);
    expect(response.body.nom).toBe('Direction Financière');
  });

  it('un Architecte peut supprimer un service (204)', async () => {
    prismaMock.service.count.mockResolvedValue(1);
    prismaMock.service.delete.mockResolvedValue(mockService);
    await request(app.getHttpServer()).delete(`/services/${mockService.id}`).expect(204);
  });

  it('un Architecte peut lister les membres pour choisir un titulaire (200)', async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: 'u1', nom: 'Alice' }]);
    const response = await request(app.getHttpServer()).get('/services/membres').expect(200);
    expect(response.body).toEqual([{ id: 'u1', nom: 'Alice' }]);
  });

  it('un Architecte peut affecter un titulaire à un poste (200)', async () => {
    prismaMock.service.count.mockResolvedValue(1);
    prismaMock.user.count.mockResolvedValue(1);
    prismaMock.service.update.mockResolvedValue({ ...mockService, titulaireId: TITULAIRE_ID });
    const response = await request(app.getHttpServer())
      .patch(`/services/${mockService.id}`)
      .send({ titulaireId: TITULAIRE_ID })
      .expect(200);
    expect(response.body.titulaireId).toBe(TITULAIRE_ID);
  });

  it('refuse un titulaire hors organisation (400)', async () => {
    prismaMock.service.count.mockResolvedValue(1);
    prismaMock.user.count.mockResolvedValue(0);
    await request(app.getHttpServer())
      .patch(`/services/${mockService.id}`)
      .send({ titulaireId: TITULAIRE_ID })
      .expect(400);
  });

  it('un Superadmin sans organisation reçoit 403 en tentant de lister les services', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).get('/services').expect(403);
  });

  it('un Superadmin sans organisation reçoit 403 en tentant de créer un service', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).post('/services').send({ nom: 'X' }).expect(403);
  });
});
