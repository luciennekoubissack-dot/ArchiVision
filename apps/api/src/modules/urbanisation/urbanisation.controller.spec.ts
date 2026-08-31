import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur, TypeZone } from '@prisma/client';
import { UrbanisationController } from './urbanisation.controller';
import { UrbanisationService } from './urbanisation.service';
import { UrbanisationViewService } from './urbanisation-view.service';

describe('UrbanisationController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockApplication = {
    id: 'app-001',
    nom: 'CRM',
    description: null,
    organisationId: 'org-001',
  };

  const mockZone = {
    id: 'zone-001',
    nom: 'Zone commerciale',
    type: TypeZone.ZONE,
    parentId: null,
    organisationId: 'org-001',
  };

  const mockIlot = { ...mockZone, id: 'zone-002', nom: 'Îlot A', type: TypeZone.ILOT };

  const SOURCE_ID = '11111111-1111-1111-8111-111111111111';
  const TARGET_ID = '22222222-2222-2222-8222-222222222222';

  const mockAffectation = {
    applicationId: SOURCE_ID,
    zoneId: TARGET_ID,
  };

  const mockEchange = {
    id: 'echange-001',
    sourceId: 'app-001',
    targetId: 'app-002',
    description: null,
    protocole: null,
  };

  const mockService = { id: 'service-001', nom: 'Consultation dossier', description: null, applicationId: 'app-001' };

  const prismaMock = {
    application: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    zoneUrbanisation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    applicationZone: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    applicationEchange: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    applicationService: {
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
      controllers: [UrbanisationController],
      providers: [UrbanisationService, UrbanisationViewService],
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

  // ── Applications ──────────────────────────────────────────────────────────

  it('un Architecte peut créer une application (201)', async () => {
    prismaMock.application.create.mockResolvedValue(mockApplication);
    const response = await request(app.getHttpServer())
      .post('/applications')
      .send({ nom: mockApplication.nom })
      .expect(201);
    expect(response.body).toEqual(mockApplication);
  });

  it('un Architecte peut lister les applications (200)', async () => {
    prismaMock.application.findMany.mockResolvedValue([mockApplication]);
    const response = await request(app.getHttpServer()).get('/applications').expect(200);
    expect(response.body).toEqual([mockApplication]);
  });

  it('un Architecte peut générer la vue des composants applicatifs (200)', async () => {
    prismaMock.application.findMany.mockResolvedValue([]);
    prismaMock.applicationEchange.findMany.mockResolvedValue([]);
    const response = await request(app.getHttpServer()).get('/applications/generate-vue').expect(200);
    expect(response.body.applicationCount).toBe(0);
    expect(response.body.echangeCount).toBe(0);
    expect(typeof response.body.svg).toBe('string');
  });

  it('un Architecte peut consulter une application par identifiant (200)', async () => {
    prismaMock.application.findUnique.mockResolvedValue(mockApplication);
    const response = await request(app.getHttpServer()).get(`/applications/${mockApplication.id}`).expect(200);
    expect(response.body).toEqual(mockApplication);
  });

  it('un Architecte peut mettre à jour une application (200)', async () => {
    prismaMock.application.count.mockResolvedValue(1);
    prismaMock.application.update.mockResolvedValue({ ...mockApplication, nom: 'ERP' });
    const response = await request(app.getHttpServer())
      .patch(`/applications/${mockApplication.id}`)
      .send({ nom: 'ERP' })
      .expect(200);
    expect(response.body.nom).toBe('ERP');
  });

  it('un Architecte peut supprimer une application (204)', async () => {
    prismaMock.application.count.mockResolvedValue(1);
    prismaMock.application.delete.mockResolvedValue(mockApplication);
    await request(app.getHttpServer()).delete(`/applications/${mockApplication.id}`).expect(204);
  });

  // ── Zones d'urbanisation ──────────────────────────────────────────────────

  it("un Architecte peut créer une zone d'urbanisation (201)", async () => {
    prismaMock.zoneUrbanisation.create.mockResolvedValue(mockZone);
    const response = await request(app.getHttpServer())
      .post('/zones-urbanisation')
      .send({ nom: mockZone.nom, type: mockZone.type })
      .expect(201);
    expect(response.body).toEqual(mockZone);
  });

  it("un Architecte peut lister les zones d'urbanisation (200)", async () => {
    prismaMock.zoneUrbanisation.findMany.mockResolvedValue([mockZone]);
    const response = await request(app.getHttpServer()).get('/zones-urbanisation').expect(200);
    expect(response.body).toEqual([mockZone]);
  });

  it("un Architecte peut générer la vue des zones d'urbanisation (200)", async () => {
    prismaMock.zoneUrbanisation.findMany.mockResolvedValue([]);
    const response = await request(app.getHttpServer()).get('/zones-urbanisation/generate-vue').expect(200);
    expect(response.body.zoneCount).toBe(0);
    expect(response.body.applicationCount).toBe(0);
    expect(typeof response.body.svg).toBe('string');
  });

  it("un Architecte peut consulter une zone d'urbanisation par identifiant (200)", async () => {
    prismaMock.zoneUrbanisation.findUnique.mockResolvedValue(mockZone);
    const response = await request(app.getHttpServer()).get(`/zones-urbanisation/${mockZone.id}`).expect(200);
    expect(response.body).toEqual(mockZone);
  });

  it("un Architecte peut mettre à jour une zone d'urbanisation (200)", async () => {
    prismaMock.zoneUrbanisation.count.mockResolvedValue(1);
    prismaMock.zoneUrbanisation.update.mockResolvedValue({ ...mockZone, nom: 'Nouveau nom' });
    const response = await request(app.getHttpServer())
      .patch(`/zones-urbanisation/${mockZone.id}`)
      .send({ nom: 'Nouveau nom' })
      .expect(200);
    expect(response.body.nom).toBe('Nouveau nom');
  });

  it("un Architecte peut supprimer une zone d'urbanisation (204)", async () => {
    prismaMock.zoneUrbanisation.count.mockResolvedValue(1);
    prismaMock.zoneUrbanisation.delete.mockResolvedValue(mockZone);
    await request(app.getHttpServer()).delete(`/zones-urbanisation/${mockZone.id}`).expect(204);
  });

  // ── Affectations POS ──────────────────────────────────────────────────────

  it("un Architecte peut affecter une application à un îlot (201)", async () => {
    prismaMock.application.count.mockResolvedValue(1);
    prismaMock.zoneUrbanisation.findUnique.mockResolvedValue({ type: TypeZone.ILOT, organisationId: 'org-001' });
    prismaMock.applicationZone.findUnique.mockResolvedValue(null);
    prismaMock.applicationZone.create.mockResolvedValue(mockAffectation);
    const response = await request(app.getHttpServer())
      .post('/zones-urbanisation/affecter')
      .send({ applicationId: SOURCE_ID, zoneId: TARGET_ID })
      .expect(201);
    expect(response.body).toEqual(mockAffectation);
  });

  it("un Architecte peut retirer une application d'une zone d'urbanisation (204)", async () => {
    prismaMock.application.count.mockResolvedValue(1);
    prismaMock.zoneUrbanisation.count.mockResolvedValue(1);
    prismaMock.applicationZone.findUnique.mockResolvedValue(mockAffectation);
    prismaMock.applicationZone.delete.mockResolvedValue(mockAffectation);
    await request(app.getHttpServer())
      .delete(`/zones-urbanisation/${mockIlot.id}/applications/${mockApplication.id}`)
      .expect(204);
  });

  // ── Échanges applicatifs ────────────────────────────────────────────────────

  it('un Architecte peut lister les échanges applicatifs (200)', async () => {
    prismaMock.applicationEchange.findMany.mockResolvedValue([mockEchange]);
    const response = await request(app.getHttpServer()).get('/applications-echanges').expect(200);
    expect(response.body).toEqual([mockEchange]);
  });

  it('un Architecte peut créer un échange applicatif (201)', async () => {
    prismaMock.application.findUnique
      .mockResolvedValueOnce({ ...mockApplication, id: SOURCE_ID })
      .mockResolvedValueOnce({ ...mockApplication, id: TARGET_ID });
    // createEchange inclut { source: true, target: true } dans son include Prisma :
    // la réponse mockée reflète cette forme imbriquée plutôt que de simples identifiants.
    prismaMock.applicationEchange.create.mockResolvedValue({
      ...mockEchange,
      sourceId: SOURCE_ID,
      targetId: TARGET_ID,
      source: { ...mockApplication, id: SOURCE_ID },
      target: { ...mockApplication, id: TARGET_ID },
    });
    const response = await request(app.getHttpServer())
      .post('/applications-echanges')
      .send({ sourceId: SOURCE_ID, targetId: TARGET_ID })
      .expect(201);
    expect(response.body.source.id).toBe(SOURCE_ID);
    expect(response.body.target.id).toBe(TARGET_ID);
  });

  it('un Architecte peut supprimer un échange applicatif (204)', async () => {
    prismaMock.applicationEchange.findUnique.mockResolvedValue({
      ...mockEchange,
      source: { organisationId: 'org-001' },
    });
    prismaMock.applicationEchange.delete.mockResolvedValue(mockEchange);
    await request(app.getHttpServer()).delete(`/applications-echanges/${mockEchange.id}`).expect(204);
  });

  // ── Services applicatifs ────────────────────────────────────────────────────

  it('un Architecte peut ajouter un service applicatif à une application (201)', async () => {
    prismaMock.application.count.mockResolvedValue(1);
    prismaMock.applicationService.create.mockResolvedValue(mockService);
    const response = await request(app.getHttpServer())
      .post(`/applications/${mockApplication.id}/services`)
      .send({ nom: mockService.nom })
      .expect(201);
    expect(response.body).toEqual(mockService);
  });

  it('un Architecte peut supprimer un service applicatif (204)', async () => {
    prismaMock.applicationService.findUnique.mockResolvedValue({
      ...mockService,
      application: { organisationId: 'org-001' },
    });
    prismaMock.applicationService.delete.mockResolvedValue(mockService);
    await request(app.getHttpServer()).delete(`/applications/services/${mockService.id}`).expect(204);
  });

  // ── Accès superadmin ──────────────────────────────────────────────────────
  // Aucun @Roles n'est appliqué sur ce contrôleur : la seule barrière restante
  // est requireOrganisationId, qui rejette tout appelant sans organisationId
  // (cas du Superadmin) avant même d'atteindre le service.

  it('un Superadmin sans organisation reçoit 403 (requireOrganisationId)', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).get('/applications').expect(403);
  });
});
