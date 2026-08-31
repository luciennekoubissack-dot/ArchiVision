import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { ArchitectureApplicativeController } from './architecture-applicative.controller';
import { ArchitectureApplicativeService } from './architecture-applicative.service';
import { ArchitectureApplicativeViewService } from './architecture-applicative-view.service';

describe('ArchitectureApplicativeController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockElement = {
    id: 'elem-001',
    nom: 'CRM',
    type: 'APPLICATION',
    description: null,
    positionX: null,
    positionY: null,
    organisationId: 'org-001',
  };

  const mockFlux = {
    id: 'flux-001',
    sourceId: 'elem-001',
    targetId: 'elem-002',
    type: 'DONNEES',
    label: null,
  };

  const prismaMock = {
    archiApplicativeElement: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    archiApplicativeFlux: {
      create: jest.fn(),
      findMany: jest.fn(),
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
      controllers: [ArchitectureApplicativeController],
      providers: [ArchitectureApplicativeService, ArchitectureApplicativeViewService],
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

  it('un Architecte peut lister les éléments (200) : lecture ouverte', async () => {
    prismaMock.archiApplicativeElement.findMany.mockResolvedValue([mockElement]);
    const response = await request(app.getHttpServer()).get('/architecture-applicative/elements').expect(200);
    expect(response.body).toEqual([mockElement]);
  });

  it('un Architecte peut générer la vue (200) : lecture ouverte', async () => {
    prismaMock.archiApplicativeElement.findMany.mockResolvedValue([mockElement]);
    prismaMock.archiApplicativeFlux.findMany.mockResolvedValue([]);
    const response = await request(app.getHttpServer()).get('/architecture-applicative/generate-vue').expect(200);
    expect(response.body.elementCount).toBe(1);
    expect(response.body.fluxCount).toBe(0);
    expect(response.body.svg).toContain('<svg');
  });

  it('un Architecte peut créer un élément (201)', async () => {
    prismaMock.archiApplicativeElement.create.mockResolvedValue(mockElement);
    const response = await request(app.getHttpServer())
      .post('/architecture-applicative/elements')
      .send({ nom: mockElement.nom, type: 'APPLICATION' })
      .expect(201);
    expect(response.body.nom).toBe(mockElement.nom);
  });

  it('un Superadmin reçoit 403 en tentant de créer un élément', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer())
      .post('/architecture-applicative/elements')
      .send({ nom: 'X', type: 'APPLICATION' })
      .expect(403);
  });

  it('un Architecte peut mettre à jour un élément (200)', async () => {
    prismaMock.archiApplicativeElement.findUnique.mockResolvedValue(mockElement);
    prismaMock.archiApplicativeElement.update.mockResolvedValue({ ...mockElement, nom: 'CRM v2' });
    const response = await request(app.getHttpServer())
      .patch(`/architecture-applicative/elements/${mockElement.id}`)
      .send({ nom: 'CRM v2' })
      .expect(200);
    expect(response.body.nom).toBe('CRM v2');
  });

  it('un Superadmin reçoit 403 en tentant de mettre à jour un élément', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer())
      .patch(`/architecture-applicative/elements/${mockElement.id}`)
      .send({ nom: 'X' })
      .expect(403);
  });

  it('un Architecte peut supprimer un élément (204)', async () => {
    prismaMock.archiApplicativeElement.findUnique.mockResolvedValue(mockElement);
    prismaMock.archiApplicativeElement.delete.mockResolvedValue(mockElement);
    await request(app.getHttpServer()).delete(`/architecture-applicative/elements/${mockElement.id}`).expect(204);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer un élément', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).delete(`/architecture-applicative/elements/${mockElement.id}`).expect(403);
  });

  it('un Architecte peut lister les flux (200) : lecture ouverte', async () => {
    prismaMock.archiApplicativeFlux.findMany.mockResolvedValue([mockFlux]);
    const response = await request(app.getHttpServer()).get('/architecture-applicative/flux').expect(200);
    expect(response.body).toEqual([mockFlux]);
  });

  it('un Architecte peut créer un flux (201)', async () => {
    prismaMock.archiApplicativeElement.findUnique
      .mockResolvedValueOnce(mockElement)
      .mockResolvedValueOnce({ ...mockElement, id: 'elem-002' });
    prismaMock.archiApplicativeFlux.create.mockResolvedValue(mockFlux);
    const response = await request(app.getHttpServer())
      .post('/architecture-applicative/flux')
      .send({ sourceId: '11111111-1111-4111-8111-111111111111', targetId: '22222222-2222-4222-8222-222222222222' })
      .expect(201);
    expect(response.body.id).toBe(mockFlux.id);
  });

  it('un Superadmin reçoit 403 en tentant de créer un flux', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer())
      .post('/architecture-applicative/flux')
      .send({ sourceId: '11111111-1111-4111-8111-111111111111', targetId: '22222222-2222-4222-8222-222222222222' })
      .expect(403);
  });

  it('un Architecte peut supprimer un flux (204)', async () => {
    prismaMock.archiApplicativeFlux.findUnique.mockResolvedValue({ ...mockFlux, source: mockElement });
    prismaMock.archiApplicativeFlux.delete.mockResolvedValue(mockFlux);
    await request(app.getHttpServer()).delete(`/architecture-applicative/flux/${mockFlux.id}`).expect(204);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer un flux', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).delete(`/architecture-applicative/flux/${mockFlux.id}`).expect(403);
  });
});
