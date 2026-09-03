import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { QuestionnaireController } from './questionnaire.controller';
import { QuestionnaireService } from './questionnaire.service';

describe('QuestionnaireController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockQuestionnaire = {
    id: 'q-001',
    titre: 'Satisfaction architecture',
    description: null,
    reponseFichierUrl: null,
    reponseFichierNom: null,
    organisationId: 'org-001',
    questions: [],
  };

  const prismaMock = {
    questionnaire: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    question: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };
  prismaMock.$transaction.mockImplementation((cb: (tx: typeof prismaMock) => unknown) => cb(prismaMock));

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
      controllers: [QuestionnaireController],
      providers: [QuestionnaireService],
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

  it('un Architecte peut lister les questionnaires (200)', async () => {
    prismaMock.questionnaire.findMany.mockResolvedValue([mockQuestionnaire]);
    const res = await request(app.getHttpServer()).get('/questionnaires').expect(200);
    expect(res.body).toEqual([mockQuestionnaire]);
  });

  it('un Architecte peut créer un questionnaire (201)', async () => {
    prismaMock.questionnaire.create.mockResolvedValue(mockQuestionnaire);
    const res = await request(app.getHttpServer())
      .post('/questionnaires')
      .send({
        titre: mockQuestionnaire.titre,
        questions: [
          { intitule: 'Recommanderiez-vous ?', type: 'OUI_NON' },
          { intitule: 'Canal préféré ?', type: 'CHOIX_MULTIPLE', options: ['Mail', 'Réunion'] },
        ],
      })
      .expect(201);
    expect(res.body.titre).toBe(mockQuestionnaire.titre);
  });

  it('rejette une création avec un type de question inconnu (400)', async () => {
    await request(app.getHttpServer())
      .post('/questionnaires')
      .send({ titre: 'x', questions: [{ intitule: 'q', type: 'QCM' }] })
      .expect(400);
  });

  it('rejette un choix multiple à une seule option (400)', async () => {
    await request(app.getHttpServer())
      .post('/questionnaires')
      .send({ titre: 'x', questions: [{ intitule: 'Canal ?', type: 'CHOIX_MULTIPLE', options: ['Mail'] }] })
      .expect(400);
  });

  it('un Superadmin reçoit 403 en tentant de créer un questionnaire', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer())
      .post('/questionnaires')
      .send({ titre: 'x', questions: [] })
      .expect(403);
  });

  it('un Superadmin reçoit 403 en tentant de supprimer un questionnaire', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).delete('/questionnaires/q-001').expect(403);
  });

  it('un Architecte peut détacher le fichier de réponses (200)', async () => {
    prismaMock.questionnaire.count.mockResolvedValue(1);
    prismaMock.questionnaire.update.mockResolvedValue(mockQuestionnaire);
    await request(app.getHttpServer()).delete('/questionnaires/q-001/reponse-fichier').expect(200);
  });
});
