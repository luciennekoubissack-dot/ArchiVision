import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

// process.cwd() = racine du repo (les scripts npm/nest sont lancés depuis là),
// indépendant de la profondeur du fichier compilé dans dist/.
export const UPLOADS_DIR = join(process.cwd(), 'apps', 'api', 'uploads');

mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export const logoMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(new BadRequestException('Format de fichier non supporté (PNG, JPEG, WEBP ou SVG attendu).'), false);
      return;
    }
    callback(null, true);
  },
};
