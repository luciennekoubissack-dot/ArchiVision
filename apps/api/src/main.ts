import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createSimpleRateLimiter, HttpExceptionFilter, requireFrontendOrigin } from '@archivision/shared';
import { AppModule } from './app.module';
import { UPLOADS_DIR } from './modules/uploads/uploads.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(compression());
  app.use(cookieParser());
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads/' });

  // Origine unique attendue : l'app Angular (dev ou prod), seule à envoyer
  // le cookie de session. `credentials: true` est nécessaire pour que ce
  // cookie httpOnly voyage sur les requêtes cross-origin. Pas de valeur par
  // défaut : un oubli de configuration doit bloquer le démarrage plutôt que
  // de retomber silencieusement sur localhost (voir requireFrontendOrigin).
  app.enableCors({
    origin: requireFrontendOrigin(config),
    credentials: true,
  });

  // Toutes les routes métier vivent sous /api/v1 ; la documentation Swagger
  // (ci-dessous) reste hors préfixe, à /api/docs, et les fichiers statiques
  // d'uploads restent à /uploads (servis en dehors du routeur Nest).
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // supprime les champs non déclarés dans les DTO
      forbidNonWhitelisted: true,
      transform: true,       // transforme les types (string → number, etc.)
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // Le schéma Bearer est le seul praticable pour "Try it out" : CsrfGuard
  // laisse passer les requêtes authentifiées par Bearer sans jeton CSRF,
  // alors que le flux cookie (utilisé par l'app Angular) demanderait de
  // reproduire manuellement le double-submit cookie/en-tête dans Swagger UI.
  // Le jeton s'obtient via POST /api/v1/auth/login (champ `accessToken`).
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ArchiVision API')
    .setDescription("API de la plateforme d'architecture d'entreprise ArchiVision (démarche TOGAF ADM).")
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  // SwaggerModule monte ses routes directement sur l'adaptateur HTTP, hors
  // du pipeline de guards Nest : ThrottlerGuard ne s'y applique pas. On pose
  // donc une limite dédiée, simple, juste pour ces deux routes de doc. Les
  // deux routes partagent le même compteur (`/api/docs-json` n'est pas
  // couvert par `app.use('/api/docs', ...)` seul : Express exige une
  // frontière de segment après le préfixe, absente entre "docs" et "-json").
  const docsRateLimiter = createSimpleRateLimiter(60, 60_000);
  app.use('/api/docs', docsRateLimiter);
  app.use('/api/docs-json', docsRateLimiter);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  logger.log(`API démarrée sur http://localhost:${port}/api/v1`);
  logger.log(`Documentation Swagger sur http://localhost:${port}/api/docs`);
}

bootstrap();
