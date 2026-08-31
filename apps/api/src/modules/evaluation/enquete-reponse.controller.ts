import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, PaginationQueryDto, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '@archivision/shared';
import { EnqueteReponseService } from './enquete-reponse.service';
import { ImportEnqueteDto } from './dto/import-enquete.dto';
import { EnqueteReponseEntity } from './entities/enquete-reponse.entity';

@ApiTags('enquete-reponses')
@ApiBearerAuth('access-token')
@Controller('enquete-reponses')
export class EnqueteReponseController {
  constructor(private readonly service: EnqueteReponseService) {}

  @ApiOperation({ summary: "Lister les reponses d'enquete de l'organisation" })
  @Get()
  @ApiOkResponse({
    type: [EnqueteReponseEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(EnqueteReponseEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAll(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: "Importer une liste de reponses d'enquete" })
  @Post('import')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: [EnqueteReponseEntity], description: "Ensemble des reponses de l'organisation apres import." })
  import(@CurrentUser() user: AuthUser, @Body() dto: ImportEnqueteDto) {
    return this.service.importReponses(requireOrganisationId(user), dto.items);
  }

  @ApiOperation({ summary: "Supprimer une reponse d'enquete" })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, requireOrganisationId(user));
  }
}
