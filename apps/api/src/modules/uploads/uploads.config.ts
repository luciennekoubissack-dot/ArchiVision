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

// SVG volontairement exclu : un SVG peut embarquer du <script> exécuté si le
// fichier est ouvert directement dans un onglet, et cet endpoint est public
// (utilisé pendant l'inscription, avant qu'un compte/JWT n'existe) — pas de
// sanitisation fiable ici qui justifierait de le réautoriser.
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

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
      callback(new BadRequestException('Format de fichier non supporté (PNG, JPEG ou WEBP attendu).'), false);
      return;
    }
    callback(null, true);
  },
};
