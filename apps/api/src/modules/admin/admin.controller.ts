import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RoleUtilisateur } from '@prisma/client';
import { ApiPaginatedResponse, PaginationQueryDto, Roles, RolesGuard, SuperAdminRoute } from '@archivision/shared';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ListOrganisationsQueryDto } from './dto/list-organisations-query.dto';
import { AdminOrganisationActionResultEntity, AdminOrganisationEntity, AdminOrganisationListItemEntity } from './entities/organisation.entity';
import { AdminUtilisateurEntity } from './entities/utilisateur.entity';
import { AdminStatsEntity } from './entities/stats.entity';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(RoleUtilisateur.SUPERADMIN)
@SuperAdminRoute()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Liste les organisations, avec filtre optionnel par statut.' })
  @Get('organisations')
  @ApiOkResponse({
    type: [AdminOrganisationListItemEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(AdminOrganisationListItemEntity)
  listOrganisations(@Query() query: ListOrganisationsQueryDto) {
    return this.adminService.listOrganisations(query.statut, query);
  }

  @ApiOperation({ summary: 'Récupère une organisation par son identifiant.' })
  @Get('organisations/:id')
  @ApiOkResponse({ type: AdminOrganisationEntity })
  getOrganisation(@Param('id') id: string) {
    return this.adminService.getOrganisation(id);
  }

  @ApiOperation({ summary: 'Valide une organisation en attente.' })
  @Post('organisations/:id/valider')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AdminOrganisationActionResultEntity })
  valider(@Param('id') id: string) {
    return this.adminService.valider(id);
  }

  @ApiOperation({ summary: 'Rejette une organisation en attente.' })
  @Post('organisations/:id/rejeter')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AdminOrganisationActionResultEntity })
  rejeter(@Param('id') id: string) {
    return this.adminService.rejeter(id);
  }

  @ApiOperation({ summary: 'Supprime une organisation.' })
  @Delete('organisations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param('id') id: string): Promise<void> {
    await this.adminService.remove(id);
  }

  @ApiOperation({ summary: 'Liste les utilisateurs, avec pagination.' })
  @Get('utilisateurs')
  @ApiOkResponse({
    type: [AdminUtilisateurEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(AdminUtilisateurEntity)
  listUtilisateurs(@Query() pagination: PaginationQueryDto) {
    return this.adminService.listUtilisateurs(pagination);
  }

  @ApiOperation({ summary: 'Récupère les statistiques globales de la plateforme.' })
  @Get('stats')
  @ApiOkResponse({ type: AdminStatsEntity })
  stats() {
    return this.adminService.stats();
  }
}
