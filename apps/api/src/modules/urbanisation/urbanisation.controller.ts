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
import { AuthUser, CurrentUser, PaginationQueryDto, requireOrganisationId } from '@archivision/shared';

@Controller()
export class UrbanisationController {
  constructor(
    private readonly service: UrbanisationService,
    private readonly viewService: UrbanisationViewService,
  ) {}

  // ── Applications ──────────────────────────────────────────────────────────
  // Convention : /applications

  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  createApplication(@CurrentUser() user: AuthUser, @Body() dto: CreateApplicationDto) {
    return this.service.createApplication(requireOrganisationId(user), dto);
  }

  @Get('applications')
  findAllApplications(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAllApplications(requireOrganisationId(user), pagination);
  }

  @Get('applications/generate-vue')
  generateComponentsVue(@CurrentUser() user: AuthUser) {
    return this.viewService.generateComponents(requireOrganisationId(user));
  }

  @Get('applications/:id')
  findOneApplication(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOneApplication(id, requireOrganisationId(user));
  }

  @Patch('applications/:id')
  updateApplication(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.service.updateApplication(id, requireOrganisationId(user), dto);
  }

  @Delete('applications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeApplication(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeApplication(id, requireOrganisationId(user));
  }

  // ── Zones d'urbanisation ──────────────────────────────────────────────────
  // Convention : /zones-urbanisation

  @Post('zones-urbanisation')
  @HttpCode(HttpStatus.CREATED)
  createZone(@CurrentUser() user: AuthUser, @Body() dto: CreateZoneDto) {
    return this.service.createZone(requireOrganisationId(user), dto);
  }

  @Get('zones-urbanisation')
  findAllZones(@CurrentUser() user: AuthUser, @Query('type') type?: TypeZone) {
    return this.service.findAllZones(requireOrganisationId(user), type);
  }

  @Get('zones-urbanisation/generate-vue')
  generateVue(@CurrentUser() user: AuthUser) {
    return this.viewService.generate(requireOrganisationId(user));
  }

  @Get('zones-urbanisation/:id')
  findOneZone(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOneZone(id, requireOrganisationId(user));
  }

  @Patch('zones-urbanisation/:id')
  updateZone(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.service.updateZone(id, requireOrganisationId(user), dto);
  }

  @Delete('zones-urbanisation/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeZone(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeZone(id, requireOrganisationId(user));
  }

  // ── Affectations POS ──────────────────────────────────────────────────────
  // Convention : /zones-urbanisation/:zoneId/applications

  @Post('zones-urbanisation/affecter')
  @HttpCode(HttpStatus.CREATED)
  affecter(@CurrentUser() user: AuthUser, @Body() dto: AffecterApplicationDto) {
    return this.service.affecter(requireOrganisationId(user), dto);
  }

  @Delete('zones-urbanisation/:zoneId/applications/:applicationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  desaffecter(
    @CurrentUser() user: AuthUser,
    @Param('zoneId') zoneId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.service.desaffecter(requireOrganisationId(user), applicationId, zoneId);
  }

  // ── Échanges applicatifs (diagramme de composants UML) ─────────────────────
  // Convention : /applications-echanges

  @Get('applications-echanges')
  findAllEchanges(@CurrentUser() user: AuthUser) {
    return this.service.findAllEchanges(requireOrganisationId(user));
  }

  @Post('applications-echanges')
  @HttpCode(HttpStatus.CREATED)
  createEchange(@CurrentUser() user: AuthUser, @Body() dto: CreateEchangeDto) {
    return this.service.createEchange(requireOrganisationId(user), dto);
  }

  @Delete('applications-echanges/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeEchange(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeEchange(id, requireOrganisationId(user));
  }

  // ── Services applicatifs ────────────────────────────────────────────────────
  // Convention : /applications/:id/services

  @Post('applications/:id/services')
  @HttpCode(HttpStatus.CREATED)
  addService(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateApplicationServiceDto,
  ) {
    return this.service.addService(id, requireOrganisationId(user), dto);
  }

  @Delete('applications/services/:serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeService(@CurrentUser() user: AuthUser, @Param('serviceId') serviceId: string) {
    return this.service.removeService(serviceId, requireOrganisationId(user));
  }
}
