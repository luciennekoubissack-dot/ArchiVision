import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule, PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { VisionCanvasController } from './vision-canvas.controller';
import { VisionCanvasService } from './vision-canvas.service';

describe('VisionCanvasController (HTTP)', () => {
  let app: INestApplication;
  let currentUser: { sub: string; email: string; organisationId: string | null; role: RoleUtilisateur };

  const architecte = {
    sub: 'user-001',
    email: 'architecte@k-and-b.local',
    organisationId: 'org-001',
    role: RoleUtilisateur.ARCHITECTE,
  };
  const superadmin = { ...architecte, sub: 'user-002', organisationId: null, role: RoleUtilisateur.SUPERADMIN };

  const mockCanvas = { id: 'canvas-001', organisationId: 'org-001', targetGroup: null };

  const prismaMock = {
    visionCanvas: {
      upsert: jest.fn(),
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
      controllers: [VisionCanvasController],
      providers: [VisionCanvasService],
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

  it('un Architecte peut consulter le canevas (200) — lecture ouverte', async () => {
    prismaMock.visionCanvas.upsert.mockResolvedValue(mockCanvas);
    const response = await request(app.getHttpServer()).get('/vision-canvas').expect(200);
    expect(response.body).toEqual(mockCanvas);
  });

  it('un Architecte peut mettre à jour le canevas (200)', async () => {
    prismaMock.visionCanvas.upsert.mockResolvedValue({ ...mockCanvas, targetGroup: 'PME' });
    const response = await request(app.getHttpServer())
      .patch('/vision-canvas')
      .send({ targetGroup: 'PME' })
      .expect(200);
    expect(response.body.targetGroup).toBe('PME');
  });

  it('un Superadmin reçoit 403 en tentant de modifier le canevas', async () => {
    currentUser = superadmin;
    await request(app.getHttpServer()).patch('/vision-canvas').send({ targetGroup: 'X' }).expect(403);
  });
});
