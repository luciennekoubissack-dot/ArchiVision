import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, PaginationQueryDto, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '@archivision/shared';
import { DonneesService } from './donnees.service';
import { CreateDataEntityDto } from './dto/create-data-entity.dto';
import { UpdateDataEntityDto } from './dto/update-data-entity.dto';
import { CreateDataAttributeDto } from './dto/create-data-attribute.dto';
import { CreateDataRelationDto } from './dto/create-data-relation.dto';
import { DataEntityEntity } from './entities/data-entity.entity';
import { DataAttributeEntity } from './entities/data-attribute.entity';
import { DataRelationEntity } from './entities/data-relation.entity';
import { DataRelationDetailEntity } from './entities/data-relation-detail.entity';

@ApiTags('data-entities')
@ApiBearerAuth('access-token')
@Controller('data-entities')
export class DonneesController {
  constructor(private readonly donneesService: DonneesService) {}

  @ApiOperation({ summary: 'Liste les entites de donnees de l\'organisation' })
  @Get()
  @ApiOkResponse({
    type: [DataEntityEntity],
    description: "Tableau complet si aucune pagination n'est demandee (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(DataEntityEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.donneesService.findAll(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: 'Liste les relations entre entites de donnees' })
  @Get('relations')
  @ApiOkResponse({
    type: [DataRelationDetailEntity],
    description: "Tableau complet si aucune pagination n'est demandee (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(DataRelationDetailEntity)
  findAllRelations(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.donneesService.findAllRelations(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: 'Recupere une entite de donnees par son identifiant' })
  @Get(':id')
  @ApiOkResponse({ type: DataEntityEntity })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.donneesService.findOne(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Cree une nouvelle entite de donnees' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: DataEntityEntity })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDataEntityDto) {
    return this.donneesService.create(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Met a jour une entite de donnees' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: DataEntityEntity })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateDataEntityDto) {
    return this.donneesService.update(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprime une entite de donnees' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.donneesService.remove(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Ajoute un attribut a une entite de donnees' })
  @Post(':id/attributs')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: DataAttributeEntity })
  addAttribute(@CurrentUser() user: AuthUser, @Param('id') entityId: string, @Body() dto: CreateDataAttributeDto) {
    return this.donneesService.addAttribute(entityId, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprime un attribut' })
  @Delete('attributs/:attributeId')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeAttribute(@CurrentUser() user: AuthUser, @Param('attributeId') attributeId: string) {
    return this.donneesService.removeAttribute(attributeId, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Cree une relation entre deux entites de donnees' })
  @Post('relations')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: DataRelationEntity })
  createRelation(@CurrentUser() user: AuthUser, @Body() dto: CreateDataRelationDto) {
    return this.donneesService.createRelation(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprime une relation entre entites de donnees' })
  @Delete('relations/:relationId')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeRelation(@CurrentUser() user: AuthUser, @Param('relationId') relationId: string) {
    return this.donneesService.removeRelation(relationId, requireOrganisationId(user));
  }
}
