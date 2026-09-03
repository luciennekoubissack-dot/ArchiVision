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
// fichier est ouvert directement dans un onglet, et le logo est téléversé par
// un endpoint public (pendant l'inscription, avant qu'un compte/JWT n'existe) :
// pas de sanitisation fiable ici qui justifierait de le réautoriser.
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const imageMulterOptions: MulterOptions = {
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

// Documents joints (ex. fichier de réponses d'un questionnaire) : PDF ou
// tableur. Endpoint authentifié uniquement, d'où une limite de taille plus
// large que pour les images. Pas de HTML/SVG/exécutable.
const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv',
  'application/csv',
];

export const documentMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
      callback(new BadRequestException('Format de fichier non supporté (PDF ou Excel attendu).'), false);
      return;
    }
    callback(null, true);
  },
};
