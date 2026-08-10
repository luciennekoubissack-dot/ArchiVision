import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '@archivision/shared';
import { logoMulterOptions } from './uploads.config';

@Controller('uploads')
export class UploadsController {
  @Post('logo')
  @Public()
  @UseInterceptors(FileInterceptor('file', logoMulterOptions))
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu.');
    }
    return { url: `/uploads/${file.filename}` };
  }
}
