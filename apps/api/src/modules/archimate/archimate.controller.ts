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
import { TypeElement } from '@prisma/client';
import { CreateCapaciteDto } from './dto/create-capacite.dto';
import { UpdateCapaciteDto } from './dto/update-capacite.dto';
import { CreateElementDto } from './dto/create-element.dto';
import { UpdateElementDto } from './dto/update-element.dto';
import { CreateRelationDto } from './dto/create-relation.dto';

@Controller()
export class ArchimateController {
  constructor(private readonly service: ArchimateService) {}

  // ── Capacités métier ──────────────────────────────────────────────────────
  // Convention : /capacites-metier

  @Post('capacites-metier')
  @HttpCode(HttpStatus.CREATED)
  createCapacite(@Body() dto: CreateCapaciteDto) {
    return this.service.createCapacite(dto);
  }

  @Get('capacites-metier')
  findAllCapacites(@Query('organisationId') organisationId: string) {
    return this.service.findAllCapacites(organisationId);
  }

  @Get('capacites-metier/:id')
  findOneCapacite(@Param('id') id: string) {
    return this.service.findOneCapacite(id);
  }

  @Patch('capacites-metier/:id')
  updateCapacite(@Param('id') id: string, @Body() dto: UpdateCapaciteDto) {
    return this.service.updateCapacite(id, dto);
  }

  @Delete('capacites-metier/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCapacite(@Param('id') id: string) {
    return this.service.removeCapacite(id);
  }

  // ── Éléments ArchiMate ────────────────────────────────────────────────────
  // Convention : /elements-archimate

  @Post('elements-archimate')
  @HttpCode(HttpStatus.CREATED)
  createElement(@Body() dto: CreateElementDto) {
    return this.service.createElement(dto);
  }

  @Get('elements-archimate')
  findAllElements(
    @Query('organisationId') organisationId: string,
    @Query('type') type?: TypeElement,
  ) {
    return this.service.findAllElements(organisationId, type);
  }

  @Get('elements-archimate/:id')
  findOneElement(@Param('id') id: string) {
    return this.service.findOneElement(id);
  }

  @Patch('elements-archimate/:id')
  updateElement(@Param('id') id: string, @Body() dto: UpdateElementDto) {
    return this.service.updateElement(id, dto);
  }

  @Delete('elements-archimate/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeElement(@Param('id') id: string) {
    return this.service.removeElement(id);
  }

  // ── Relations ArchiMate ───────────────────────────────────────────────────
  // Convention : /relations-archimate

  @Post('relations-archimate')
  @HttpCode(HttpStatus.CREATED)
  createRelation(@Body() dto: CreateRelationDto) {
    return this.service.createRelation(dto);
  }

  @Get('relations-archimate')
  findAllRelations(@Query('organisationId') organisationId: string) {
    return this.service.findAllRelations(organisationId);
  }

  @Delete('relations-archimate/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRelation(@Param('id') id: string) {
    return this.service.removeRelation(id);
  }
}
