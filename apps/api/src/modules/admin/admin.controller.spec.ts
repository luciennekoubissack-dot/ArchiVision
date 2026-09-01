import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MailService } from '../mail/mail.service';

describe('AdminController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  // Toutes les routes de ce contrôleur exigent SUPERADMIN via un RolesGuard
  // posé au niveau classe : ici c'est l'Architecte qui doit systématiquement
  // recevoir 403, à l'inverse du pattern habituel.
  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockOrganisationListItem = {
    id: 'org-001',
    nom: 'Acme Corp',
    secteur: 'Technologie',
    taille: 'PME',
    pays: 'FR',
    ville: 'Paris',
    statut: 'EN_ATTENTE',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    validatedAt: null,
    _count: { users: 3 },
  };

  const mockOrganisationDetail = {
    ...mockOrganisationListItem,
    description: null,
    vision: 'Digitaliser la relation client',
    users: [{ id: 'user-010', nom: 'Amina Admin', email: 'amina@acme.local', role: 'ADMINISTRATEUR', createdAt: mockOrganisationListItem.createdAt }],
  };

  const mockOrganisationAfterAction = {
    id: 'org-001',
    nom: 'Acme Corp',
    statut: 'VALIDEE',
    validatedAt: new Date('2026-01-02T00:00:00.000Z'),
    _count: { users: 3 },
  };

  const mockUtilisateur = {
    id: 'user-010',
    nom: 'Amina Admin',
    email: 'amina@acme.local',
    role: 'ADMINISTRATEUR',
    createdAt: mockOrganisationListItem.createdAt,
    organisation: { id: 'org-001', nom: 'Acme Corp' },
  };

  const mockStats = {
    totalUtilisateurs: 42,
    organisations: { enAttente: 2, validees: 10, rejetees: 1, total: 13 },
  };

  const prismaMock = {
    organisation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
  };

  const configMock = {
    get: jest.fn((key: string) => (key === 'FRONTEND_ORIGIN' ? 'http://localhost:4201' : undefined)),
  };

  const mailMock = {
    sendOrganisationValidee: jest.fn((to: string, _nom: string, loginUrl: string) =>
      Promise.resolve({ to, subject: 'Bienvenue sur ArchiVision : votre organisation est validée', body: loginUrl }),
    ),
    sendOrganisationRejetee: jest.fn((to: string) =>
      Promise.resolve({ to, subject: "ArchiVision : votre demande d'inscription", body: '' }),
    ),
  };

  const fakeAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      context.switchToHttp().getRequest().user = currentUser;
      return true;
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    currentUser = superadmin;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      controllers: [AdminController],
      providers: [
        AdminService,
        { provide: ConfigService, useValue: configMock },
        { provide: MailService, useValue: mailMock },
      ],
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

  it('un Superadmin peut lister les organisations (200)', async () => {
    prismaMock.organisation.findMany.mockResolvedValue([mockOrganisationListItem]);
    const response = await request(app.getHttpServer()).get('/admin/organisations').expect(200);
    expect(response.body).toEqual([{ ...mockOrganisationListItem, createdAt: mockOrganisationListItem.createdAt.toISOString() }]);
  });

  it('un Architecte reçoit 403 en tentant de lister les organisations', async () => {
    currentUser = architecte;
    await request(app.getHttpServer()).get('/admin/organisations').expect(403);
  });

  it('un Superadmin peut récupérer une organisation par son identifiant (200)', async () => {
    prismaMock.organisation.findUnique.mockResolvedValue(mockOrganisationDetail);
    const response = await request(app.getHttpServer()).get(`/admin/organisations/${mockOrganisationDetail.id}`).expect(200);
    expect(response.body.id).toBe(mockOrganisationDetail.id);
  });

  it('un Architecte reçoit 403 en tentant de récupérer une organisation', async () => {
    currentUser = architecte;
    await request(app.getHttpServer()).get(`/admin/organisations/${mockOrganisationDetail.id}`).expect(403);
  });

  it('un Superadmin peut valider une organisation en attente (200)', async () => {
    prismaMock.organisation.findUnique.mockResolvedValue(mockOrganisationDetail);
    prismaMock.organisation.update.mockResolvedValue(mockOrganisationAfterAction);
    prismaMock.user.findFirst.mockResolvedValue({ email: 'amina@acme.local' });
    const response = await request(app.getHttpServer()).post(`/admin/organisations/${mockOrganisationDetail.id}/valider`).expect(200);
    expect(response.body.organisation.statut).toBe('VALIDEE');
    expect(response.body.email.to).toBe('amina@acme.local');
  });

  it('un Architecte reçoit 403 en tentant de valider une organisation', async () => {
    currentUser = architecte;
    await request(app.getHttpServer()).post(`/admin/organisations/${mockOrganisationDetail.id}/valider`).expect(403);
  });

  it('un Superadmin peut rejeter une organisation en attente (200)', async () => {
    prismaMock.organisation.findUnique.mockResolvedValue(mockOrganisationDetail);
    prismaMock.organisation.update.mockResolvedValue({ ...mockOrganisationAfterAction, statut: 'REJETEE', validatedAt: null });
    prismaMock.user.findFirst.mockResolvedValue({ email: 'amina@acme.local' });
    const response = await request(app.getHttpServer()).post(`/admin/organisations/${mockOrganisationDetail.id}/rejeter`).expect(200);
    expect(response.body.organisation.statut).toBe('REJETEE');
  });

  it('un Architecte reçoit 403 en tentant de rejeter une organisation', async () => {
    currentUser = architecte;
    await request(app.getHttpServer()).post(`/admin/organisations/${mockOrganisationDetail.id}/rejeter`).expect(403);
  });

  it('un Superadmin peut supprimer une organisation (204)', async () => {
    prismaMock.organisation.findUnique.mockResolvedValue(mockOrganisationDetail);
    prismaMock.organisation.delete.mockResolvedValue(mockOrganisationDetail);
    await request(app.getHttpServer()).delete(`/admin/organisations/${mockOrganisationDetail.id}`).expect(204);
  });

  it('un Architecte reçoit 403 en tentant de supprimer une organisation', async () => {
    currentUser = architecte;
    await request(app.getHttpServer()).delete(`/admin/organisations/${mockOrganisationDetail.id}`).expect(403);
  });

  it('un Superadmin peut lister les utilisateurs (200)', async () => {
    prismaMock.user.findMany.mockResolvedValue([mockUtilisateur]);
    const response = await request(app.getHttpServer()).get('/admin/utilisateurs').expect(200);
    expect(response.body).toEqual([{ ...mockUtilisateur, createdAt: mockUtilisateur.createdAt.toISOString() }]);
  });

  it('un Architecte reçoit 403 en tentant de lister les utilisateurs', async () => {
    currentUser = architecte;
    await request(app.getHttpServer()).get('/admin/utilisateurs').expect(403);
  });

  it('un Superadmin peut consulter les statistiques globales (200)', async () => {
    prismaMock.user.count.mockResolvedValue(mockStats.totalUtilisateurs);
    prismaMock.organisation.count
      .mockResolvedValueOnce(mockStats.organisations.enAttente)
      .mockResolvedValueOnce(mockStats.organisations.validees)
      .mockResolvedValueOnce(mockStats.organisations.rejetees);
    const response = await request(app.getHttpServer()).get('/admin/stats').expect(200);
    expect(response.body).toEqual(mockStats);
  });

  it('un Architecte reçoit 403 en tentant de consulter les statistiques globales', async () => {
    currentUser = architecte;
    await request(app.getHttpServer()).get('/admin/stats').expect(403);
  });
});
