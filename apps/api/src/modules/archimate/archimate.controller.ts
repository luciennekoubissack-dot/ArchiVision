import {
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
} from '@nestjs/common';
import { ArchimateService } from './archimate.service';
import { ArchimateViewService } from './archimate-view.service';
import { ArchimateLayoutService } from './archimate-layout.service';
import { CreateCapaciteDto } from './dto/create-capacite.dto';
import { UpdateCapaciteDto } from './dto/update-capacite.dto';
import { CreateElementDto } from './dto/create-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';
import { CreateRelationDto } from './dto/create-relation.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { UpdatePositionsBatchDto } from './dto/update-positions-batch.dto';
import { ListElementsQueryDto } from './dto/list-elements-query.dto';
import { AuthUser, ApiPaginatedResponse, CurrentUser, PaginationQueryDto, requireOrganisationId } from '@archivision/shared';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CapaciteMetierEntity } from './entities/capacite-metier.entity';
import { ElementArchimateEntity } from './entities/element-archimate.entity';
import { RelationArchimateEntity } from './entities/relation-archimate.entity';
import { ArchimateViewEntity, ArchimateLayoutEntity } from './entities/archimate-view.entity';

@ApiTags('archimate')
@ApiBearerAuth('access-token')
@Controller()
export class ArchimateController {
  constructor(
    private readonly service: ArchimateService,
    private readonly viewService: ArchimateViewService,
    private readonly layoutService: ArchimateLayoutService,
  ) {}

  // ── Capacités métier ──────────────────────────────────────────────────────
  // Convention : /capacites-metier

  @ApiOperation({ summary: 'Créer une capacité métier' })
  @Post('capacites-metier')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: CapaciteMetierEntity })
  createCapacite(@CurrentUser() user: AuthUser, @Body() dto: CreateCapaciteDto) {
    return this.service.createCapacite(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Lister les capacités métier, avec pagination' })
  @Get('capacites-metier')
  @ApiOkResponse({
    type: [CapaciteMetierEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(CapaciteMetierEntity)
  findAllCapacites(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAllCapacites(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: 'Récupérer une capacité métier par son identifiant' })
  @Get('capacites-metier/:id')
  @ApiOkResponse({ type: CapaciteMetierEntity })
  findOneCapacite(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOneCapacite(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Mettre à jour une capacité métier' })
  @Patch('capacites-metier/:id')
  @ApiOkResponse({ type: CapaciteMetierEntity })
  updateCapacite(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateCapaciteDto) {
    return this.service.updateCapacite(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprimer une capacité métier' })
  @Delete('capacites-metier/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeCapacite(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeCapacite(id, requireOrganisationId(user));
  }

  // ── Éléments ArchiMate ────────────────────────────────────────────────────
  // Convention : /elements-archimate

  @ApiOperation({ summary: 'Créer un élément ArchiMate' })
  @Post('elements-archimate')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: ElementArchimateEntity })
  createElement(@CurrentUser() user: AuthUser, @Body() dto: CreateElementDto) {
    return this.service.createElement(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Lister les éléments ArchiMate, avec pagination optionnelle et filtre par type' })
  @Get('elements-archimate')
  @ApiOkResponse({
    type: [ElementArchimateEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(ElementArchimateEntity)
  findAllElements(@CurrentUser() user: AuthUser, @Query() query: ListElementsQueryDto) {
    return this.service.findAllElements(requireOrganisationId(user), query.type, query);
  }

  @ApiOperation({ summary: "Générer la vue ArchiMate à partir des éléments et relations existants" })
  @Get('elements-archimate/generate-vue')
  @ApiOkResponse({ type: ArchimateViewEntity })
  generateVue(@CurrentUser() user: AuthUser) {
    return this.viewService.generate(requireOrganisationId(user));
  }

  @ApiOperation({ summary: "Générer et enregistrer la disposition automatique des éléments ArchiMate" })
  @Post('elements-archimate/generate-layout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ArchimateLayoutEntity })
  generateLayout(@CurrentUser() user: AuthUser) {
    return this.layoutService.generateAndPersist(requireOrganisationId(user));
  }

  // Doit précéder ':id' pour ne pas être capturée par ce segment générique.
  @ApiOperation({ summary: 'Mettre à jour les positions de plusieurs éléments en une seule requête' })
  @Patch('elements-archimate/positions')
  @ApiOkResponse({ type: [ElementArchimateEntity] })
  updatePositionsBatch(@CurrentUser() user: AuthUser, @Body() dto: UpdatePositionsBatchDto) {
    return this.service.updateElementPositionsBatch(requireOrganisationId(user), dto.items);
  }

  @ApiOperation({ summary: 'Récupérer un élément ArchiMate par son identifiant' })
  @Get('elements-archimate/:id')
  @ApiOkResponse({ type: ElementArchimateEntity })
  findOneElement(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOneElement(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Mettre à jour un élément ArchiMate' })
  @Patch('elements-archimate/:id')
  @ApiOkResponse({ type: ElementArchimateEntity })
  updateElement(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateElementDto) {
    return this.service.updateElement(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: "Mettre à jour la position d'un élément ArchiMate sur le canevas" })
  @Patch('elements-archimate/:id/position')
  @ApiOkResponse({ type: ElementArchimateEntity })
  updatePosition(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.service.updateElementPosition(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprimer un élément ArchiMate' })
  @Delete('elements-archimate/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeElement(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeElement(id, requireOrganisationId(user));
  }

  // ── Relations ArchiMate ───────────────────────────────────────────────────
  // Convention : /relations-archimate

  @ApiOperation({ summary: 'Créer une relation ArchiMate entre deux éléments' })
  @Post('relations-archimate')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: RelationArchimateEntity })
  createRelation(@CurrentUser() user: AuthUser, @Body() dto: CreateRelationDto) {
    return this.service.createRelation(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Lister les relations ArchiMate, avec pagination' })
  @Get('relations-archimate')
  @ApiOkResponse({
    type: [RelationArchimateEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(RelationArchimateEntity)
  findAllRelations(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAllRelations(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: 'Supprimer une relation ArchiMate' })
  @Delete('relations-archimate/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeRelation(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeRelation(id, requireOrganisationId(user));
  }
}
