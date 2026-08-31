import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { HealthController } from './health.controller';

describe('HealthController (HTTP)', () => {
  let app: INestApplication;

  const prismaMock = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      controllers: [HealthController],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('renvoie un statut ok quand la base de données répond (200)', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body).toEqual({ status: 'ok', db: 'ok' });
  });

  it("renvoie un statut d'erreur si la base de données est injoignable, sans faire échouer la requête HTTP (200)", async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('connexion refusée'));

    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body).toEqual({ status: 'error', db: 'unreachable' });
  });
});
