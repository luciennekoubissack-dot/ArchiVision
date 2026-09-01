import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { BpmnController } from './bpmn.controller';
import { BpmnService } from './bpmn.service';
import { BpmnViewService } from './bpmn-view.service';

describe('BpmnController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockProcessus = {
    id: 'processus-001',
    nom: 'Traitement de commande',
    description: null,
    etapes: null,
    bpmnXml: null,
    organisationId: 'org-001',
  };

  const mockElement = {
    id: 'element-001',
    nom: 'Valider la commande',
    type: 'TACHE',
    statut: 'LES_DEUX',
    positionX: null,
    positionY: null,
    processusId: mockProcessus.id,
  };

  const mockFlow = { id: 'flow-001', sourceId: 'element-001', targetId: 'element-002', label: null };

  const SOURCE_ID = '11111111-1111-1111-8111-111111111111';
  const TARGET_ID = '22222222-2222-2222-8222-222222222222';

  const prismaMock = {
    bpmnProcessus: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    bpmnElement: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    bpmnFlow: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  prismaMock.$transaction.mockImplementation((callback: (tx: typeof prismaMock) => unknown) => callback(prismaMock));

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
      controllers: [BpmnController],
      providers: [BpmnService, BpmnViewService],
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

  it('un Architecte peut lister les processus BPMN (200) : lecture ouverte', async () => {
    prismaMock.bpmnProcessus.findMany.mockResolvedValue([mockProcessus]);
    const response = await request(app.getHttpServer()).get('/bpmn-processus').expect(200);
    expect(response.body).toEqual([mockProcessus]);
  });

  it('un Architecte peut consulter un processus BPMN par identifiant (200)', async () => {
    prismaMock.bpmnProcessus.findUnique.mockResolvedValue({ ...mockProcessus, elements: [] });
    const response = await request(app.getHttpServer()).get(`/bpmn-processus/${mockProcessus.id}`).expect(200);
    expect(response.body.id).toBe(mockProcessus.id);
  });

  it('un Architecte peut generer la vue SVG d\'un processus BPMN (200)', async () => {
    prismaMock.bpmnProcessus.findUnique.mockResolvedValue({
      ...mockProcessus,
      elements: [
        { id: 'el-001', nom: 'Debut', type: 'EVENEMENT_DEBUT', positionX: null, positionY: null, flowsSource: [], flowsTarget: [] },
      ],
    });
    const response = await request(app.getHttpServer()).get(`/bpmn-processus/${mockProcessus.id}/generate-vue`).expect(200);
    expect(response.body.elementCount).toBe(1);
    expect(response.body.svg).toContain('<svg');
  });

  it('un Architecte peut creer un processus BPMN (201)', async () => {
    prismaMock.bpmnProcessus.create.mockResolvedValue(mockProcessus);
    const response = await request(app.getHttpServer())
      .post('/bpmn-processus')
      .send({ nom: mockProcessus.nom })
      .expect(201);
    expect(response.body.nom).toBe(mockProcessus.nom);
  });

  it('un Architecte peut generer une proposition de diagramme depuis les etapes (200)', async () => {
    prismaMock.bpmnProcessus.findUnique
      .mockResolvedValueOnce({ ...mockProcessus, etapes: 'Recevoir la demande\nValider la demande', elements: [] })
      .mockResolvedValueOnce({ ...mockProcessus, elements: [] });
    prismaMock.bpmnElement.create.mockImplementation(({ data }: { data: { nom: string } }) =>
      Promise.resolve({ id: `el-${data.nom}`, ...data }),
    );
    prismaMock.bpmnFlow.create.mockResolvedValue({ id: 'flow-001' });

    await request(app.getHttpServer())
      .post(`/bpmn-processus/${mockProcessus.id}/generer-diagramme`)
      .expect(200);

    expect(prismaMock.bpmnElement.create).toHaveBeenCalledTimes(4);
  });

  it('renvoie 400 en generant un diagramme deja peuple', async () => {
    prismaMock.bpmnProcessus.findUnique.mockResolvedValue({
      ...mockProcessus,
      etapes: 'Une etape',
      elements: [{ id: 'el-001' }],
    });
    await request(app.getHttpServer())
      .post(`/bpmn-processus/${mockProcessus.id}/generer-diagramme`)
      .expect(400);
  });

  it('un Superadmin reçoit 403 en tentant de generer un diagramme', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer())
      .post(`/bpmn-processus/${mockProcessus.id}/generer-diagramme`)
      .expect(403);
  });

  it('un Superadmin reçoit 403 en tentant de creer un processus BPMN', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).post('/bpmn-processus').send({ nom: 'X' }).expect(403);
  });

  it('un Architecte peut mettre a jour un processus BPMN (200)', async () => {
    prismaMock.bpmnProcessus.count.mockResolvedValue(1);
    prismaMock.bpmnProcessus.update.mockResolvedValue({ ...mockProcessus, nom: 'Nouveau nom' });
    const response = await request(app.getHttpServer())
      .patch(`/bpmn-processus/${mockProcessus.id}`)
      .send({ nom: 'Nouveau nom' })
      .expect(200);
    expect(response.body.nom).toBe('Nouveau nom');
  });

  it('un Superadmin reçoit 403 en tentant de mettre a jour un processus BPMN', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).patch(`/bpmn-processus/${mockProcessus.id}`).send({ nom: 'X' }).expect(403);
  });

  it('un Architecte peut supprimer un processus BPMN (204)', async () => {
    prismaMock.bpmnProcessus.count.mockResolvedValue(1);
    prismaMock.bpmnProcessus.delete.mockResolvedValue(mockProcessus);
    await request(app.getHttpServer()).delete(`/bpmn-processus/${mockProcessus.id}`).expect(204);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer un processus BPMN', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).delete(`/bpmn-processus/${mockProcessus.id}`).expect(403);
  });

  it('un Architecte peut ajouter un element a un processus BPMN (201)', async () => {
    prismaMock.bpmnProcessus.count.mockResolvedValue(1);
    prismaMock.bpmnElement.create.mockResolvedValue(mockElement);
    const response = await request(app.getHttpServer())
      .post(`/bpmn-processus/${mockProcessus.id}/elements`)
      .send({ nom: mockElement.nom, type: 'TACHE' })
      .expect(201);
    expect(response.body).toEqual(mockElement);
  });

  it('un Superadmin reçoit 403 en tentant d\'ajouter un element', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer())
      .post(`/bpmn-processus/${mockProcessus.id}/elements`)
      .send({ nom: 'Etape', type: 'TACHE' })
      .expect(403);
  });

  it('un Architecte peut mettre a jour un element BPMN (200)', async () => {
    prismaMock.bpmnElement.findUnique.mockResolvedValue({ ...mockElement, processus: mockProcessus });
    prismaMock.bpmnElement.update.mockResolvedValue({ ...mockElement, nom: 'Etape renommee' });
    const response = await request(app.getHttpServer())
      .patch(`/bpmn-processus/elements/${mockElement.id}`)
      .send({ nom: 'Etape renommee' })
      .expect(200);
    expect(response.body.nom).toBe('Etape renommee');
  });

  it('un Superadmin reçoit 403 en tentant de mettre a jour un element BPMN', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer())
      .patch(`/bpmn-processus/elements/${mockElement.id}`)
      .send({ nom: 'X' })
      .expect(403);
  });

  it('un Architecte peut supprimer un element BPMN (204)', async () => {
    prismaMock.bpmnElement.findUnique.mockResolvedValue({ ...mockElement, processus: mockProcessus });
    prismaMock.bpmnElement.delete.mockResolvedValue(mockElement);
    await request(app.getHttpServer()).delete(`/bpmn-processus/elements/${mockElement.id}`).expect(204);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer un element BPMN', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).delete(`/bpmn-processus/elements/${mockElement.id}`).expect(403);
  });

  it('un Architecte peut ajouter un flux entre deux elements BPMN (201)', async () => {
    prismaMock.bpmnProcessus.count.mockResolvedValue(1);
    prismaMock.bpmnElement.findUnique
      .mockResolvedValueOnce({ ...mockElement, id: SOURCE_ID, processusId: mockProcessus.id })
      .mockResolvedValueOnce({ ...mockElement, id: TARGET_ID, processusId: mockProcessus.id });
    prismaMock.bpmnFlow.create.mockResolvedValue(mockFlow);
    const response = await request(app.getHttpServer())
      .post(`/bpmn-processus/${mockProcessus.id}/flows`)
      .send({ sourceId: SOURCE_ID, targetId: TARGET_ID })
      .expect(201);
    expect(response.body).toEqual(mockFlow);
  });

  it('un Superadmin reçoit 403 en tentant d\'ajouter un flux', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer())
      .post(`/bpmn-processus/${mockProcessus.id}/flows`)
      .send({ sourceId: SOURCE_ID, targetId: TARGET_ID })
      .expect(403);
  });

  it('un Architecte peut supprimer un flux BPMN (204)', async () => {
    prismaMock.bpmnFlow.findUnique.mockResolvedValue({ ...mockFlow, source: { processus: mockProcessus } });
    prismaMock.bpmnFlow.delete.mockResolvedValue(mockFlow);
    await request(app.getHttpServer()).delete(`/bpmn-processus/flows/${mockFlow.id}`).expect(204);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer un flux BPMN', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).delete(`/bpmn-processus/flows/${mockFlow.id}`).expect(403);
  });
});
