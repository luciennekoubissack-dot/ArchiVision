import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { OrganisationModule } from './organisation.module';

describe('MembresController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string; role: RoleUtilisateur };

  const administrateur = {
    sub: 'user-001',
    email: 'administrateur@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ADMINISTRATEUR,
  };

  const architecte = { ...administrateur, sub: 'user-002', role: RoleUtilisateur.ARCHITECTE };

  const mockMembre = {
    id: 'user-003',
    email: 'nouveau@k-and-b.local',
    nom: 'Nouveau Membre',
    role: RoleUtilisateur.ARCHITECTE,
    serviceId: null,
  };

  const prismaMock = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
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
    currentUser = administrateur;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, OrganisationModule],
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

  it('un Administrateur peut lister les membres (200)', async () => {
    prismaMock.user.findMany.mockResolvedValue([mockMembre]);

    const response = await request(app.getHttpServer()).get('/membres').expect(200);

    expect(response.body).toEqual([mockMembre]);
  });

  it('un Architecte reçoit 403 sur /membres (RolesGuard)', async () => {
    currentUser = architecte;

    await request(app.getHttpServer()).get('/membres').expect(403);
  });

  it('un Administrateur peut créer un membre (201)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(mockMembre);

    const response = await request(app.getHttpServer())
      .post('/membres')
      .send({
        email: mockMembre.email,
        password: 'MotDePasse123!',
        nom: mockMembre.nom,
        role: RoleUtilisateur.ARCHITECTE,
      })
      .expect(201);

    expect(response.body.email).toBe(mockMembre.email);
  });

  it('rejette la création avec un rôle invalide (400)', async () => {
    await request(app.getHttpServer())
      .post('/membres')
      .send({ email: 'x@x.local', password: 'MotDePasse123!', nom: 'X', role: 'PDG' })
      .expect(400);
  });

  it('supprime un membre (204)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...mockMembre,
      organisationId: 'org-001',
      role: RoleUtilisateur.ARCHITECTE,
    });
    prismaMock.user.delete.mockResolvedValue(mockMembre);

    await request(app.getHttpServer()).delete(`/membres/${mockMembre.id}`).expect(204);
  });

  it('retourne 409 en tentant de supprimer le dernier Administrateur', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...administrateur, id: administrateur.sub, role: RoleUtilisateur.ADMINISTRATEUR });
    prismaMock.user.count.mockResolvedValue(1);

    await request(app.getHttpServer()).delete(`/membres/${administrateur.sub}`).expect(409);
  });
});
