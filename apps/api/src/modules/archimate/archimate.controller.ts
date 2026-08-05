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
import { TypeElement } from '@prisma/client';
import { CreateCapaciteDto } from './dto/create-capacite.dto';
import { UpdateCapaciteDto } from './dto/update-capacite.dto';
import { CreateElementDto } from './dto/create-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';
import { CreateRelationDto } from './dto/create-relation.dto';
import { AuthUser, CurrentUser } from '@archivision/shared';

@Controller()
export class ArchimateController {
  constructor(
    private readonly service: ArchimateService,
    private readonly viewService: ArchimateViewService,
  ) {}

  // ── Capacités métier ──────────────────────────────────────────────────────
  // Convention : /capacites-metier

  @Post('capacites-metier')
  @HttpCode(HttpStatus.CREATED)
  createCapacite(@CurrentUser() user: AuthUser, @Body() dto: CreateCapaciteDto) {
    return this.service.createCapacite(user.organisationId, dto);
  }

  @Get('capacites-metier')
  findAllCapacites(@CurrentUser() user: AuthUser) {
    return this.service.findAllCapacites(user.organisationId);
  }

  @Get('capacites-metier/:id')
  findOneCapacite(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOneCapacite(id, user.organisationId);
  }

  @Patch('capacites-metier/:id')
  updateCapacite(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateCapaciteDto) {
    return this.service.updateCapacite(id, user.organisationId, dto);
  }

  @Delete('capacites-metier/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCapacite(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeCapacite(id, user.organisationId);
  }

  // ── Éléments ArchiMate ────────────────────────────────────────────────────
  // Convention : /elements-archimate

  @Post('elements-archimate')
  @HttpCode(HttpStatus.CREATED)
  createElement(@CurrentUser() user: AuthUser, @Body() dto: CreateElementDto) {
    return this.service.createElement(user.organisationId, dto);
  }

  @Get('elements-archimate')
  findAllElements(@CurrentUser() user: AuthUser, @Query('type') type?: TypeElement) {
    return this.service.findAllElements(user.organisationId, type);
  }

  @Get('elements-archimate/generate-vue')
  generateVue(@CurrentUser() user: AuthUser) {
    return this.viewService.generate(user.organisationId);
  }

  @Get('elements-archimate/:id')
  findOneElement(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOneElement(id, user.organisationId);
  }

  @Patch('elements-archimate/:id')
  updateElement(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateElementDto) {
    return this.service.updateElement(id, user.organisationId, dto);
  }

  @Delete('elements-archimate/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeElement(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeElement(id, user.organisationId);
  }

  // ── Relations ArchiMate ───────────────────────────────────────────────────
  // Convention : /relations-archimate

  @Post('relations-archimate')
  @HttpCode(HttpStatus.CREATED)
  createRelation(@CurrentUser() user: AuthUser, @Body() dto: CreateRelationDto) {
    return this.service.createRelation(user.organisationId, dto);
  }

  @Get('relations-archimate')
  findAllRelations(@CurrentUser() user: AuthUser) {
    return this.service.findAllRelations(user.organisationId);
  }

  @Delete('relations-archimate/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRelation(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeRelation(id, user.organisationId);
  }
}
