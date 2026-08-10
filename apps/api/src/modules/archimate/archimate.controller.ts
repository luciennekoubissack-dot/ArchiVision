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
import { TypeElement } from '@prisma/client';
import { CreateCapaciteDto } from './dto/create-capacite.dto';
import { UpdateCapaciteDto } from './dto/update-capacite.dto';
import { CreateElementDto } from './dto/create-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';
import { CreateRelationDto } from './dto/create-relation.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { UpdatePositionsBatchDto } from './dto/update-positions-batch.dto';
import { AuthUser, CurrentUser, requireOrganisationId } from '@archivision/shared';

@Controller()
export class ArchimateController {
  constructor(
    private readonly service: ArchimateService,
    private readonly viewService: ArchimateViewService,
    private readonly layoutService: ArchimateLayoutService,
  ) {}

  // ── Capacités métier ──────────────────────────────────────────────────────
  // Convention : /capacites-metier

  @Post('capacites-metier')
  @HttpCode(HttpStatus.CREATED)
  createCapacite(@CurrentUser() user: AuthUser, @Body() dto: CreateCapaciteDto) {
    return this.service.createCapacite(requireOrganisationId(user), dto);
  }

  @Get('capacites-metier')
  findAllCapacites(@CurrentUser() user: AuthUser) {
    return this.service.findAllCapacites(requireOrganisationId(user));
  }

  @Get('capacites-metier/:id')
  findOneCapacite(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOneCapacite(id, requireOrganisationId(user));
  }

  @Patch('capacites-metier/:id')
  updateCapacite(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateCapaciteDto) {
    return this.service.updateCapacite(id, requireOrganisationId(user), dto);
  }

  @Delete('capacites-metier/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCapacite(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeCapacite(id, requireOrganisationId(user));
  }

  // ── Éléments ArchiMate ────────────────────────────────────────────────────
  // Convention : /elements-archimate

  @Post('elements-archimate')
  @HttpCode(HttpStatus.CREATED)
  createElement(@CurrentUser() user: AuthUser, @Body() dto: CreateElementDto) {
    return this.service.createElement(requireOrganisationId(user), dto);
  }

  @Get('elements-archimate')
  findAllElements(@CurrentUser() user: AuthUser, @Query('type') type?: TypeElement) {
    return this.service.findAllElements(requireOrganisationId(user), type);
  }

  @Get('elements-archimate/generate-vue')
  generateVue(@CurrentUser() user: AuthUser) {
    return this.viewService.generate(requireOrganisationId(user));
  }

  @Post('elements-archimate/generate-layout')
  @HttpCode(HttpStatus.OK)
  generateLayout(@CurrentUser() user: AuthUser) {
    return this.layoutService.generateAndPersist(requireOrganisationId(user));
  }

  // Doit précéder ':id' pour ne pas être capturée par ce segment générique.
  @Patch('elements-archimate/positions')
  updatePositionsBatch(@CurrentUser() user: AuthUser, @Body() dto: UpdatePositionsBatchDto) {
    return this.service.updateElementPositionsBatch(requireOrganisationId(user), dto.items);
  }

  @Get('elements-archimate/:id')
  findOneElement(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOneElement(id, requireOrganisationId(user));
  }

  @Patch('elements-archimate/:id')
  updateElement(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateElementDto) {
    return this.service.updateElement(id, requireOrganisationId(user), dto);
  }

  @Patch('elements-archimate/:id/position')
  updatePosition(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePositionDto) {
    return this.service.updateElementPosition(id, requireOrganisationId(user), dto);
  }

  @Delete('elements-archimate/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeElement(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeElement(id, requireOrganisationId(user));
  }

  // ── Relations ArchiMate ───────────────────────────────────────────────────
  // Convention : /relations-archimate

  @Post('relations-archimate')
  @HttpCode(HttpStatus.CREATED)
  createRelation(@CurrentUser() user: AuthUser, @Body() dto: CreateRelationDto) {
    return this.service.createRelation(requireOrganisationId(user), dto);
  }

  @Get('relations-archimate')
  findAllRelations(@CurrentUser() user: AuthUser) {
    return this.service.findAllRelations(requireOrganisationId(user));
  }

  @Delete('relations-archimate/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRelation(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeRelation(id, requireOrganisationId(user));
  }
}
