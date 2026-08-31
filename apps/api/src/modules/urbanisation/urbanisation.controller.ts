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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UrbanisationService } from './urbanisation.service';
import { UrbanisationViewService } from './urbanisation-view.service';
import { TypeZone } from '@prisma/client';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { AffecterApplicationDto } from './dto/affecter-application.dto';
import { CreateEchangeDto } from './dto/create-echange.dto';
import { CreateApplicationServiceDto } from './dto/create-application-service.dto';
import { AuthUser, CurrentUser, PaginationQueryDto, requireOrganisationId, ApiPaginatedResponse } from '@archivision/shared';
import { ApplicationEntity, ApplicationServiceEntity } from './entities/application.entity';
import { ZoneUrbanisationEntity } from './entities/zone.entity';
import { EchangeEntity } from './entities/echange.entity';
import { AffectationEntity } from './entities/affectation.entity';
import { ComponentsVueEntity, UrbanisationVueEntity } from './entities/vue.entity';

@ApiTags('urbanisation')
@ApiBearerAuth('access-token')
@Controller()
export class UrbanisationController {
  constructor(
    private readonly service: UrbanisationService,
    private readonly viewService: UrbanisationViewService,
  ) {}

  // ── Applications ──────────────────────────────────────────────────────────
  // Convention : /applications

  @ApiOperation({ summary: 'Créer une application' })
  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: ApplicationEntity })
  createApplication(@CurrentUser() user: AuthUser, @Body() dto: CreateApplicationDto) {
    return this.service.createApplication(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Lister les applications' })
  @Get('applications')
  @ApiOkResponse({
    type: [ApplicationEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(ApplicationEntity)
  findAllApplications(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAllApplications(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: 'Générer la vue des composants applicatifs' })
  @Get('applications/generate-vue')
  @ApiOkResponse({ type: ComponentsVueEntity })
  generateComponentsVue(@CurrentUser() user: AuthUser) {
    return this.viewService.generateComponents(requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Récupérer une application par son identifiant' })
  @Get('applications/:id')
  @ApiOkResponse({ type: ApplicationEntity })
  findOneApplication(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOneApplication(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Mettre à jour une application' })
  @Patch('applications/:id')
  @ApiOkResponse({ type: ApplicationEntity })
  updateApplication(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.service.updateApplication(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprimer une application' })
  @Delete('applications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeApplication(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeApplication(id, requireOrganisationId(user));
  }

  // ── Zones d'urbanisation ──────────────────────────────────────────────────
  // Convention : /zones-urbanisation

  @ApiOperation({ summary: "Créer une zone d'urbanisation" })
  @Post('zones-urbanisation')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: ZoneUrbanisationEntity })
  createZone(@CurrentUser() user: AuthUser, @Body() dto: CreateZoneDto) {
    return this.service.createZone(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: "Lister les zones d'urbanisation" })
  @Get('zones-urbanisation')
  @ApiOkResponse({ type: [ZoneUrbanisationEntity] })
  findAllZones(@CurrentUser() user: AuthUser, @Query('type') type?: TypeZone) {
    return this.service.findAllZones(requireOrganisationId(user), type);
  }

  @ApiOperation({ summary: "Générer la vue des zones d'urbanisation" })
  @Get('zones-urbanisation/generate-vue')
  @ApiOkResponse({ type: UrbanisationVueEntity })
  generateVue(@CurrentUser() user: AuthUser) {
    return this.viewService.generate(requireOrganisationId(user));
  }

  @ApiOperation({ summary: "Récupérer une zone d'urbanisation par son identifiant" })
  @Get('zones-urbanisation/:id')
  @ApiOkResponse({ type: ZoneUrbanisationEntity })
  findOneZone(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOneZone(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: "Mettre à jour une zone d'urbanisation" })
  @Patch('zones-urbanisation/:id')
  @ApiOkResponse({ type: ZoneUrbanisationEntity })
  updateZone(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.service.updateZone(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: "Supprimer une zone d'urbanisation" })
  @Delete('zones-urbanisation/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeZone(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeZone(id, requireOrganisationId(user));
  }

  // ── Affectations POS ──────────────────────────────────────────────────────
  // Convention : /zones-urbanisation/:zoneId/applications

  @ApiOperation({ summary: "Affecter une application à une zone d'urbanisation" })
  @Post('zones-urbanisation/affecter')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: AffectationEntity })
  affecter(@CurrentUser() user: AuthUser, @Body() dto: AffecterApplicationDto) {
    return this.service.affecter(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: "Retirer une application d'une zone d'urbanisation" })
  @Delete('zones-urbanisation/:zoneId/applications/:applicationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  desaffecter(
    @CurrentUser() user: AuthUser,
    @Param('zoneId') zoneId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.service.desaffecter(requireOrganisationId(user), applicationId, zoneId);
  }

  // ── Échanges applicatifs (diagramme de composants UML) ─────────────────────
  // Convention : /applications-echanges

  @ApiOperation({ summary: 'Lister les échanges applicatifs' })
  @Get('applications-echanges')
  @ApiOkResponse({ type: [EchangeEntity] })
  findAllEchanges(@CurrentUser() user: AuthUser) {
    return this.service.findAllEchanges(requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Créer un échange applicatif' })
  @Post('applications-echanges')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: EchangeEntity })
  createEchange(@CurrentUser() user: AuthUser, @Body() dto: CreateEchangeDto) {
    return this.service.createEchange(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprimer un échange applicatif' })
  @Delete('applications-echanges/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeEchange(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeEchange(id, requireOrganisationId(user));
  }

  // ── Services applicatifs ────────────────────────────────────────────────────
  // Convention : /applications/:id/services

  @ApiOperation({ summary: 'Ajouter un service applicatif à une application' })
  @Post('applications/:id/services')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: ApplicationServiceEntity })
  addService(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateApplicationServiceDto,
  ) {
    return this.service.addService(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprimer un service applicatif' })
  @Delete('applications/services/:serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeService(@CurrentUser() user: AuthUser, @Param('serviceId') serviceId: string) {
    return this.service.removeService(serviceId, requireOrganisationId(user));
  }
}
