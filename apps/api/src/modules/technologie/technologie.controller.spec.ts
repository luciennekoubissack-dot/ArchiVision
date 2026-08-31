import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur, StatutElement, TypeTechComponent } from '@prisma/client';
import { TechnologieController } from './technologie.controller';
import { TechnologieService } from './technologie.service';

describe('TechnologieController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const APPLICATION_ID = '11111111-1111-1111-8111-111111111111';
  const TECH_COMPONENT_ID = '22222222-2222-2222-8222-222222222222';

  const mockComponent = {
    id: 'tech-001',
    nom: 'Serveur principal',
    type: TypeTechComponent.SERVEUR,
    description: null,
    statut: StatutElement.LES_DEUX,
    positionX: null,
    positionY: null,
    organisationId: 'org-001',
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
    deploiements: [],
  };

  const mockApplication = { id: APPLICATION_ID, organisationId: 'org-001' };
  const mockTechComponent = { ...mockComponent, id: TECH_COMPONENT_ID };
  const mockDeploiement = { applicationId: APPLICATION_ID, techComponentId: TECH_COMPONENT_ID };

  const prismaMock = {
    techComponent: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    application: {
      findUnique: jest.fn(),
    },
    techDeploiement: {
      create: jest.fn(),
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
      controllers: [TechnologieController],
      providers: [TechnologieService],
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

  it('un Architecte peut lister les composants technologiques (200)', async () => {
    prismaMock.techComponent.findMany.mockResolvedValue([mockComponent]);
    const response = await request(app.getHttpServer()).get('/tech-components').expect(200);
    expect(response.body).toEqual([{ ...mockComponent, createdAt: mockComponent.createdAt.toISOString(), updatedAt: mockComponent.updatedAt.toISOString() }]);
  });

  it('un Architecte peut récupérer un composant technologique par son identifiant (200)', async () => {
    prismaMock.techComponent.findUnique.mockResolvedValue(mockComponent);
    const response = await request(app.getHttpServer()).get(`/tech-components/${mockComponent.id}`).expect(200);
    expect(response.body.id).toBe(mockComponent.id);
  });

  it('la récupération d\'un composant introuvable reçoit 404', async () => {
    prismaMock.techComponent.findUnique.mockResolvedValue(null);
    await request(app.getHttpServer()).get('/tech-components/inconnu').expect(404);
  });

  it('un Architecte peut créer un composant technologique (201)', async () => {
    prismaMock.techComponent.create.mockResolvedValue(mockComponent);
    const response = await request(app.getHttpServer())
      .post('/tech-components')
      .send({ nom: mockComponent.nom, type: TypeTechComponent.SERVEUR })
      .expect(201);
    expect(response.body.nom).toBe(mockComponent.nom);
  });

  it('un Superadmin reçoit 403 en tentant de créer un composant technologique', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).post('/tech-components').send({ nom: 'X', type: TypeTechComponent.SERVEUR }).expect(403);
  });

  it('un Architecte peut mettre à jour un composant technologique (200)', async () => {
    prismaMock.techComponent.count.mockResolvedValue(1);
    prismaMock.techComponent.update.mockResolvedValue({ ...mockComponent, nom: 'Serveur secondaire' });
    const response = await request(app.getHttpServer())
      .patch(`/tech-components/${mockComponent.id}`)
      .send({ nom: 'Serveur secondaire' })
      .expect(200);
    expect(response.body.nom).toBe('Serveur secondaire');
  });

  it('un Superadmin reçoit 403 en tentant de mettre à jour un composant technologique', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).patch(`/tech-components/${mockComponent.id}`).send({ nom: 'X' }).expect(403);
  });

  it('la mise à jour d\'un composant introuvable reçoit 404', async () => {
    prismaMock.techComponent.count.mockResolvedValue(0);
    await request(app.getHttpServer()).patch('/tech-components/inconnu').send({ nom: 'X' }).expect(404);
  });

  it('un Architecte peut supprimer un composant technologique (204)', async () => {
    prismaMock.techComponent.count.mockResolvedValue(1);
    prismaMock.techComponent.delete.mockResolvedValue(mockComponent);
    await request(app.getHttpServer()).delete(`/tech-components/${mockComponent.id}`).expect(204);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer un composant technologique', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).delete(`/tech-components/${mockComponent.id}`).expect(403);
  });

  it('un Architecte peut déployer une application sur un composant technologique (201)', async () => {
    prismaMock.application.findUnique.mockResolvedValue(mockApplication);
    prismaMock.techComponent.findUnique.mockResolvedValue(mockTechComponent);
    prismaMock.techDeploiement.findUnique.mockResolvedValue(null);
    prismaMock.techDeploiement.create.mockResolvedValue(mockDeploiement);

    const response = await request(app.getHttpServer())
      .post('/tech-components/deployer')
      .send({ applicationId: APPLICATION_ID, techComponentId: TECH_COMPONENT_ID })
      .expect(201);
    expect(response.body).toEqual(mockDeploiement);
  });

  it('un déploiement en doublon reçoit 409', async () => {
    prismaMock.application.findUnique.mockResolvedValue(mockApplication);
    prismaMock.techComponent.findUnique.mockResolvedValue(mockTechComponent);
    prismaMock.techDeploiement.findUnique.mockResolvedValue(mockDeploiement);

    await request(app.getHttpServer())
      .post('/tech-components/deployer')
      .send({ applicationId: APPLICATION_ID, techComponentId: TECH_COMPONENT_ID })
      .expect(409);
  });

  it('un identifiant non UUID pour le déploiement reçoit 400', async () => {
    await request(app.getHttpServer())
      .post('/tech-components/deployer')
      .send({ applicationId: 'pas-un-uuid', techComponentId: TECH_COMPONENT_ID })
      .expect(400);
  });

  it('un Superadmin reçoit 403 en tentant de déployer une application', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer())
      .post('/tech-components/deployer')
      .send({ applicationId: APPLICATION_ID, techComponentId: TECH_COMPONENT_ID })
      .expect(403);
  });

  it('un Architecte peut retirer le déploiement d\'une application (204)', async () => {
    prismaMock.techComponent.findUnique.mockResolvedValue(mockTechComponent);
    prismaMock.techDeploiement.delete.mockResolvedValue(mockDeploiement);
    await request(app.getHttpServer())
      .delete(`/tech-components/${TECH_COMPONENT_ID}/applications/${APPLICATION_ID}`)
      .expect(204);
  });

  it('un Superadmin reçoit 403 en tentant de retirer un déploiement', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer())
      .delete(`/tech-components/${TECH_COMPONENT_ID}/applications/${APPLICATION_ID}`)
      .expect(403);
  });
});
