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
import { AuthUser, CurrentUser } from '@archivision/shared';

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
    return this.service.createApplication(user.organisationId, dto);
  }

  @Get('applications')
  findAllApplications(@CurrentUser() user: AuthUser) {
    return this.service.findAllApplications(user.organisationId);
  }

  @Get('applications/:id')
  findOneApplication(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOneApplication(id, user.organisationId);
  }

  @Patch('applications/:id')
  updateApplication(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.service.updateApplication(id, user.organisationId, dto);
  }

  @Delete('applications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeApplication(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeApplication(id, user.organisationId);
  }

  // ── Zones d'urbanisation ──────────────────────────────────────────────────
  // Convention : /zones-urbanisation

  @Post('zones-urbanisation')
  @HttpCode(HttpStatus.CREATED)
  createZone(@CurrentUser() user: AuthUser, @Body() dto: CreateZoneDto) {
    return this.service.createZone(user.organisationId, dto);
  }

  @Get('zones-urbanisation')
  findAllZones(@CurrentUser() user: AuthUser, @Query('type') type?: TypeZone) {
    return this.service.findAllZones(user.organisationId, type);
  }

  @Get('zones-urbanisation/generate-vue')
  generateVue(@CurrentUser() user: AuthUser) {
    return this.viewService.generate(user.organisationId);
  }

  @Get('zones-urbanisation/:id')
  findOneZone(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOneZone(id, user.organisationId);
  }

  @Patch('zones-urbanisation/:id')
  updateZone(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.service.updateZone(id, user.organisationId, dto);
  }

  @Delete('zones-urbanisation/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeZone(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeZone(id, user.organisationId);
  }

  // ── Affectations POS ──────────────────────────────────────────────────────
  // Convention : /zones-urbanisation/:zoneId/applications

  @Post('zones-urbanisation/affecter')
  @HttpCode(HttpStatus.CREATED)
  affecter(@CurrentUser() user: AuthUser, @Body() dto: AffecterApplicationDto) {
    return this.service.affecter(user.organisationId, dto);
  }

  @Delete('zones-urbanisation/:zoneId/applications/:applicationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  desaffecter(
    @CurrentUser() user: AuthUser,
    @Param('zoneId') zoneId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.service.desaffecter(user.organisationId, applicationId, zoneId);
  }
}
