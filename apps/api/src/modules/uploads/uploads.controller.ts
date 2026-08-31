import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Public } from '@archivision/shared';
import { logoMulterOptions } from './uploads.config';

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
  @UseInterceptors(FileInterceptor('file', logoMulterOptions))
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
}
