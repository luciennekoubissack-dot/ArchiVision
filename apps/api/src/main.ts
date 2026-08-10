import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { HttpExceptionFilter } from '@archivision/shared';
import { AppModule } from './app.module';
import { UPLOADS_DIR } from './modules/uploads/uploads.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads/' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // supprime les champs non déclarés dans les DTO
      forbidNonWhitelisted: true,
      transform: true,       // transforme les types (string → number, etc.)
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  logger.log(`API démarrée sur http://localhost:${port}`);
}

bootstrap();
