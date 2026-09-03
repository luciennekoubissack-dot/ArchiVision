import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  AuthUser,
  CurrentUser,
  PaginationQueryDto,
  requireOrganisationId,
  Roles,
  RolesGuard,
} from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { documentMulterOptions } from '../uploads/uploads.config';
import { QuestionnaireService } from './questionnaire.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';
import { QuestionnaireEntity } from './entities/questionnaire.entity';
import { QuestionnaireDetailEntity } from './entities/questionnaire-detail.entity';
import { QuestionnaireListItemEntity } from './entities/questionnaire-list-item.entity';

@ApiTags('questionnaires')
@ApiBearerAuth('access-token')
@Controller('questionnaires')
export class QuestionnaireController {
  constructor(private readonly service: QuestionnaireService) {}

  @ApiOperation({ summary: "Lister les questionnaires d'évaluation de l'organisation" })
  @Get()
  @ApiOkResponse({
    type: [QuestionnaireListItemEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(QuestionnaireListItemEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAll(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: 'Récupérer un questionnaire et ses questions' })
  @Get(':id')
  @ApiOkResponse({ type: QuestionnaireDetailEntity })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Créer un questionnaire' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: QuestionnaireDetailEntity })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateQuestionnaireDto) {
    return this.service.create(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Mettre à jour un questionnaire (remplace les questions si fournies)' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: QuestionnaireDetailEntity })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateQuestionnaireDto) {
    return this.service.update(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprimer un questionnaire' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Téléverser le fichier de réponses (PDF ou Excel) ; remplace le précédent' })
  @Post(':id/reponse-fichier')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @UseInterceptors(FileInterceptor('file', documentMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiCreatedResponse({ type: QuestionnaireDetailEntity })
  uploadReponseFichier(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier reçu.');
    }
    return this.service.setReponseFichier(
      id,
      requireOrganisationId(user),
      `/uploads/${file.filename}`,
      file.originalname,
    );
  }

  @ApiOperation({ summary: 'Détacher le fichier de réponses du questionnaire' })
  @Delete(':id/reponse-fichier')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: QuestionnaireEntity })
  removeReponseFichier(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeReponseFichier(id, requireOrganisationId(user));
  }
}
