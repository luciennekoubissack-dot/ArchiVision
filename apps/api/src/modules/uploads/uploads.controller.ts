import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Public } from '@archivision/shared';
import { imageMulterOptions } from './uploads.config';

class UploadLogoResultEntity {
  @ApiProperty({ description: 'Chemin relatif du fichier téléversé, servi statiquement sous /uploads.' })
  url!: string;
}

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  @Post('logo')
  @Public()
  // Endpoint public (utilisé pendant l'inscription, avant qu'un compte
  // n'existe) : limite basse pour empêcher un remplissage disque par upload
  // répété, sans gêner un usage normal (1 logo par étape d'inscription).
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file', imageMulterOptions))
  @ApiOperation({ summary: "Téléverser un logo d'organisation (endpoint public, utilisé pendant l'inscription)" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiCreatedResponse({ type: UploadLogoResultEntity })
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu.');
    }
    return { url: `/uploads/${file.filename}` };
  }

  @Post('avatar')
  // Réservé à un utilisateur authentifié (le JwtAuthGuard global s'applique
  // faute de @Public) : chaque membre ne téléverse que sa propre photo de
  // profil. Même limite basse que le logo pour borner l'écriture disque.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('file', imageMulterOptions))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Téléverser sa photo de profil (utilisateur authentifié)" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiCreatedResponse({ type: UploadLogoResultEntity })
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu.');
    }
    return { url: `/uploads/${file.filename}` };
  }
}
