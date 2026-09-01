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
import { TechnologieService } from './technologie.service';
import { TechnologieLayoutService } from './technologie-layout.service';
import { DiagramLayoutResultEntity } from '../../common/entities/diagram-layout.entity';
import { CreateTechComponentDto } from './dto/create-tech-component.dto';
import { UpdateTechComponentDto } from './dto/update-tech-component.dto';
import { DeployerApplicationDto } from './dto/deployer-application.dto';
import { TechComponentEntity } from './entities/tech-component.entity';
import { TechDeploiementEntity } from './entities/tech-deploiement.entity';

@ApiTags('tech-components')
@ApiBearerAuth('access-token')
@Controller('tech-components')
export class TechnologieController {
  constructor(
    private readonly technologieService: TechnologieService,
    private readonly technologieLayoutService: TechnologieLayoutService,
  ) {}

  @ApiOperation({ summary: 'Liste les composants technologiques de l\'organisation' })
  @Get()
  @ApiOkResponse({
    type: [TechComponentEntity],
    description: "Tableau complet si aucune pagination n'est demandee (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(TechComponentEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.technologieService.findAll(requireOrganisationId(user), pagination);
  }

  @ApiOperation({
    summary: 'Genere une disposition automatique du diagramme de deploiement',
    description:
      "Place les composants techniques en grille et persiste positionX/positionY. A appeler notamment a la premiere ouverture de l'editeur.",
  })
  @Post('generate-layout')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DiagramLayoutResultEntity })
  generateLayout(@CurrentUser() user: AuthUser) {
    return this.technologieLayoutService.generateAndPersist(requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Recupere un composant technologique par son identifiant' })
  @Get(':id')
  @ApiOkResponse({ type: TechComponentEntity })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.technologieService.findOne(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Cree un nouveau composant technologique' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: TechComponentEntity })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTechComponentDto) {
    return this.technologieService.create(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Met a jour un composant technologique' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: TechComponentEntity })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateTechComponentDto) {
    return this.technologieService.update(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprime un composant technologique' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.technologieService.remove(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Deploie une application sur un composant technologique' })
  @Post('deployer')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: TechDeploiementEntity })
  deployer(@CurrentUser() user: AuthUser, @Body() dto: DeployerApplicationDto) {
    return this.technologieService.deployer(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Retire le deploiement d\'une application sur un composant technologique' })
  @Delete(':techComponentId/applications/:applicationId')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  undeployer(
    @CurrentUser() user: AuthUser,
    @Param('techComponentId') techComponentId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.technologieService.undeployer(applicationId, techComponentId, requireOrganisationId(user));
  }
}
