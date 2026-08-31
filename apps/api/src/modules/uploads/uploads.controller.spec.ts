import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { UploadsController } from './uploads.controller';
import { UPLOADS_DIR } from './uploads.config';

describe('UploadsController (HTTP)', () => {
  let app: INestApplication;
  const uploadedFilenames: string[] = [];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
    for (const filename of uploadedFilenames.splice(0)) {
      const filePath = join(UPLOADS_DIR, filename);
      if (existsSync(filePath)) rmSync(filePath);
    }
  });

  it('téléverse un logo valide (201)', async () => {
    const response = await request(app.getHttpServer())
      .post('/uploads/logo')
      .attach('file', Buffer.from('donnée-factice'), { filename: 'logo.png', contentType: 'image/png' })
      .expect(201);

    expect(response.body.url).toMatch(/^\/uploads\/.+\.png$/);
    uploadedFilenames.push(response.body.url.replace('/uploads/', ''));
  });

  it('rejette la requête sans fichier attaché (400)', async () => {
    await request(app.getHttpServer()).post('/uploads/logo').expect(400);
  });

  it("rejette un fichier dont le type MIME n'est pas supporté (400)", async () => {
    await request(app.getHttpServer())
      .post('/uploads/logo')
      .attach('file', Buffer.from('donnée-factice'), { filename: 'logo.txt', contentType: 'text/plain' })
      .expect(400);
  });
});
