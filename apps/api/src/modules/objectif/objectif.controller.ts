import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ObjectifService } from './objectif.service';
import { CreateObjectifDto } from './dto/create-objectif.dto';
import { UpdateObjectifDto } from './dto/update-objectif.dto';
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
import { ObjectifEntity } from './entities/objectif.entity';

@ApiTags('objectifs')
@ApiBearerAuth('access-token')
@Controller('objectifs')
export class ObjectifController {
  constructor(private readonly service: ObjectifService) {}

  @ApiOperation({ summary: 'Liste les objectifs de l\'organisation, avec pagination.' })
  @Get()
  @ApiOkResponse({
    type: [ObjectifEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(ObjectifEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAll(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: 'Récupère un objectif par son identifiant.' })
  @Get(':id')
  @ApiOkResponse({ type: ObjectifEntity })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Crée un nouvel objectif.' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: ObjectifEntity })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateObjectifDto) {
    return this.service.create(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Met à jour un objectif.' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: ObjectifEntity })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateObjectifDto) {
    return this.service.update(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprime un objectif.' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, requireOrganisationId(user));
  }

  @ApiOperation({
    summary: "Marquer un objectif AS-IS comme atteint (passage à LES_DEUX).",
    description:
      "Possible uniquement si toutes les solutions liées aux écarts de cet objectif ont un avancement TERMINEE. Le statut passe de AS_IS à LES_DEUX (objectif atteint, conservé dans l'architecture cible).",
  })
  @Patch(':id/marquer-atteint')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: ObjectifEntity })
  marquerAtteint(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.marquerAtteint(id, requireOrganisationId(user));
  }
}
