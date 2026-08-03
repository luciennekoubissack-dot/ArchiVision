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
import { TypeZone } from '@prisma/client';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { AffecterApplicationDto } from './dto/affecter-application.dto';

@Controller()
export class UrbanisationController {
  constructor(private readonly service: UrbanisationService) {}

  // ── Applications ──────────────────────────────────────────────────────────
  // Convention : /applications

  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  createApplication(@Body() dto: CreateApplicationDto) {
    return this.service.createApplication(dto);
  }

  @Get('applications')
  findAllApplications(@Query('organisationId') organisationId: string) {
    return this.service.findAllApplications(organisationId);
  }

  @Get('applications/:id')
  findOneApplication(@Param('id') id: string) {
    return this.service.findOneApplication(id);
  }

  @Patch('applications/:id')
  updateApplication(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.service.updateApplication(id, dto);
  }

  @Delete('applications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeApplication(@Param('id') id: string) {
    return this.service.removeApplication(id);
  }

  // ── Zones d'urbanisation ──────────────────────────────────────────────────
  // Convention : /zones-urbanisation

  @Post('zones-urbanisation')
  @HttpCode(HttpStatus.CREATED)
  createZone(@Body() dto: CreateZoneDto) {
    return this.service.createZone(dto);
  }

  @Get('zones-urbanisation')
  findAllZones(
    @Query('organisationId') organisationId: string,
    @Query('type') type?: TypeZone,
  ) {
    return this.service.findAllZones(organisationId, type);
  }

  @Get('zones-urbanisation/:id')
  findOneZone(@Param('id') id: string) {
    return this.service.findOneZone(id);
  }

  @Patch('zones-urbanisation/:id')
  updateZone(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.service.updateZone(id, dto);
  }

  @Delete('zones-urbanisation/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeZone(@Param('id') id: string) {
    return this.service.removeZone(id);
  }

  // ── Affectations POS ──────────────────────────────────────────────────────
  // Convention : /zones-urbanisation/:zoneId/applications

  @Post('zones-urbanisation/affecter')
  @HttpCode(HttpStatus.CREATED)
  affecter(@Body() dto: AffecterApplicationDto) {
    return this.service.affecter(dto);
  }

  @Delete('zones-urbanisation/:zoneId/applications/:applicationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  desaffecter(
    @Param('zoneId') zoneId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.service.desaffecter(applicationId, zoneId);
  }
}
