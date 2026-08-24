import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@archivision/shared';
import { logoMulterOptions } from './uploads.config';

@Controller('uploads')
export class UploadsController {
  @Post('logo')
  @Public()
  // Endpoint public (utilisé pendant l'inscription, avant qu'un compte
  // n'existe) : limite basse pour empêcher un remplissage disque par upload
  // répété, sans gêner un usage normal (1 logo par étape d'inscription).
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file', logoMulterOptions))
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu.');
    }
    return { url: `/uploads/${file.filename}` };
  }
}
