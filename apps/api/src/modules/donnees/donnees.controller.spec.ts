import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { DonneesController } from './donnees.controller';
import { DonneesService } from './donnees.service';

describe('DonneesController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockEntity = {
    id: 'entity-001',
    nom: 'Client',
    description: null,
    statut: 'LES_DEUX',
    positionX: null,
    positionY: null,
    organisationId: 'org-001',
  };

  const mockAttribute = { id: 'attr-001', nom: 'email', type: 'string', entityId: mockEntity.id };

  const mockRelation = {
    id: 'rel-001',
    sourceId: 'entity-001',
    targetId: 'entity-002',
    cardinalite: 'UN_A_PLUSIEURS',
    label: null,
  };

  const SOURCE_ID = '11111111-1111-1111-8111-111111111111';
  const TARGET_ID = '22222222-2222-2222-8222-222222222222';

  const prismaMock = {
    dataEntity: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    dataAttribute: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    dataRelation: {
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
      controllers: [DonneesController],
      providers: [DonneesService],
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

  it('un Architecte peut lister les entites de donnees (200) : lecture ouverte', async () => {
    prismaMock.dataEntity.findMany.mockResolvedValue([mockEntity]);
    const response = await request(app.getHttpServer()).get('/data-entities').expect(200);
    expect(response.body).toEqual([mockEntity]);
  });

  it('un Architecte peut lister les relations entre entites (200) : lecture ouverte', async () => {
    prismaMock.dataRelation.findMany.mockResolvedValue([mockRelation]);
    const response = await request(app.getHttpServer()).get('/data-entities/relations').expect(200);
    expect(response.body).toEqual([mockRelation]);
  });

  it('un Architecte peut consulter une entite de donnees par identifiant (200)', async () => {
    prismaMock.dataEntity.findUnique.mockResolvedValue(mockEntity);
    const response = await request(app.getHttpServer()).get(`/data-entities/${mockEntity.id}`).expect(200);
    expect(response.body).toEqual(mockEntity);
  });

  it('un Architecte peut creer une entite de donnees (201)', async () => {
    prismaMock.dataEntity.create.mockResolvedValue(mockEntity);
    const response = await request(app.getHttpServer())
      .post('/data-entities')
      .send({ nom: mockEntity.nom })
      .expect(201);
    expect(response.body.nom).toBe(mockEntity.nom);
  });

  it('un Superadmin reçoit 403 en tentant de creer une entite de donnees', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).post('/data-entities').send({ nom: 'X' }).expect(403);
  });

  it('un Architecte peut mettre a jour une entite de donnees (200)', async () => {
    prismaMock.dataEntity.count.mockResolvedValue(1);
    prismaMock.dataEntity.update.mockResolvedValue({ ...mockEntity, nom: 'Client VIP' });
    const response = await request(app.getHttpServer())
      .patch(`/data-entities/${mockEntity.id}`)
      .send({ nom: 'Client VIP' })
      .expect(200);
    expect(response.body.nom).toBe('Client VIP');
  });

  it('un Superadmin reçoit 403 en tentant de mettre a jour une entite de donnees', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).patch(`/data-entities/${mockEntity.id}`).send({ nom: 'X' }).expect(403);
  });

  it('un Architecte peut supprimer une entite de donnees (204)', async () => {
    prismaMock.dataEntity.count.mockResolvedValue(1);
    prismaMock.dataEntity.delete.mockResolvedValue(mockEntity);
    await request(app.getHttpServer()).delete(`/data-entities/${mockEntity.id}`).expect(204);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer une entite de donnees', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).delete(`/data-entities/${mockEntity.id}`).expect(403);
  });

  it('un Architecte peut ajouter un attribut a une entite de donnees (201)', async () => {
    prismaMock.dataEntity.count.mockResolvedValue(1);
    prismaMock.dataAttribute.create.mockResolvedValue(mockAttribute);
    const response = await request(app.getHttpServer())
      .post(`/data-entities/${mockEntity.id}/attributs`)
      .send({ nom: mockAttribute.nom, type: mockAttribute.type })
      .expect(201);
    expect(response.body).toEqual(mockAttribute);
  });

  it('un Superadmin reçoit 403 en tentant d\'ajouter un attribut', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer())
      .post(`/data-entities/${mockEntity.id}/attributs`)
      .send({ nom: 'email', type: 'string' })
      .expect(403);
  });

  it('un Architecte peut supprimer un attribut (204)', async () => {
    prismaMock.dataAttribute.findUnique.mockResolvedValue({ ...mockAttribute, entity: mockEntity });
    prismaMock.dataAttribute.delete.mockResolvedValue(mockAttribute);
    await request(app.getHttpServer()).delete(`/data-entities/attributs/${mockAttribute.id}`).expect(204);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer un attribut', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).delete(`/data-entities/attributs/${mockAttribute.id}`).expect(403);
  });

  it('un Architecte peut creer une relation entre deux entites de donnees (201)', async () => {
    prismaMock.dataEntity.findUnique
      .mockResolvedValueOnce({ ...mockEntity, id: SOURCE_ID })
      .mockResolvedValueOnce({ ...mockEntity, id: TARGET_ID });
    prismaMock.dataRelation.create.mockResolvedValue(mockRelation);
    const response = await request(app.getHttpServer())
      .post('/data-entities/relations')
      .send({ sourceId: SOURCE_ID, targetId: TARGET_ID, cardinalite: 'UN_A_PLUSIEURS' })
      .expect(201);
    expect(response.body).toEqual(mockRelation);
  });

  it('un Superadmin reçoit 403 en tentant de creer une relation', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer())
      .post('/data-entities/relations')
      .send({ sourceId: SOURCE_ID, targetId: TARGET_ID, cardinalite: 'UN_A_PLUSIEURS' })
      .expect(403);
  });

  it('un Architecte peut supprimer une relation (204)', async () => {
    prismaMock.dataRelation.findUnique.mockResolvedValue({ ...mockRelation, source: mockEntity });
    prismaMock.dataRelation.delete.mockResolvedValue(mockRelation);
    await request(app.getHttpServer()).delete(`/data-entities/relations/${mockRelation.id}`).expect(204);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer une relation', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).delete(`/data-entities/relations/${mockRelation.id}`).expect(403);
  });
});
