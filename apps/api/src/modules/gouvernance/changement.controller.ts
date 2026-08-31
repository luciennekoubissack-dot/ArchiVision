import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser, ApiPaginatedResponse, CurrentUser, PaginationQueryDto, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChangementService } from './changement.service';
import { CreateChangementDto } from './dto/create-changement.dto';
import { UpdateChangementDto } from './dto/update-changement.dto';
import { ChangementStatsEntity, DemandeChangementEntity } from './entities/changement.entity';

@ApiTags('demandes-changement')
@ApiBearerAuth('access-token')
@Controller('demandes-changement')
export class ChangementController {
  constructor(private readonly service: ChangementService) {}

  @ApiOperation({ summary: 'Lister les demandes de changement' })
  @Get()
  @ApiOkResponse({
    type: [DemandeChangementEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(DemandeChangementEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAll(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: 'Statistiques des demandes de changement (rapport de gouvernance)' })
  @Get('stats')
  @ApiOkResponse({ type: ChangementStatsEntity })
  getStats(@CurrentUser() user: AuthUser) {
    return this.service.getStats(requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Creer une demande de changement' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: DemandeChangementEntity })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateChangementDto) {
    return this.service.create(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Mettre a jour une demande de changement' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: DemandeChangementEntity })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateChangementDto) {
    return this.service.update(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprimer une demande de changement' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, requireOrganisationId(user));
  }
}
