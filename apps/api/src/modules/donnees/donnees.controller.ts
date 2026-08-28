import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, PaginationQueryDto, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { DonneesService } from './donnees.service';
import { CreateDataEntityDto } from './dto/create-data-entity.dto';
import { UpdateDataEntityDto } from './dto/update-data-entity.dto';
import { CreateDataAttributeDto } from './dto/create-data-attribute.dto';
import { CreateDataRelationDto } from './dto/create-data-relation.dto';

@Controller('data-entities')
export class DonneesController {
  constructor(private readonly donneesService: DonneesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.donneesService.findAll(requireOrganisationId(user), pagination);
  }

  @Get('relations')
  findAllRelations(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.donneesService.findAllRelations(requireOrganisationId(user), pagination);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.donneesService.findOne(id, requireOrganisationId(user));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDataEntityDto) {
    return this.donneesService.create(requireOrganisationId(user), dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateDataEntityDto) {
    return this.donneesService.update(id, requireOrganisationId(user), dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.donneesService.remove(id, requireOrganisationId(user));
  }

  @Post(':id/attributs')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  addAttribute(@CurrentUser() user: AuthUser, @Param('id') entityId: string, @Body() dto: CreateDataAttributeDto) {
    return this.donneesService.addAttribute(entityId, requireOrganisationId(user), dto);
  }

  @Delete('attributs/:attributeId')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAttribute(@CurrentUser() user: AuthUser, @Param('attributeId') attributeId: string) {
    return this.donneesService.removeAttribute(attributeId, requireOrganisationId(user));
  }

  @Post('relations')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  createRelation(@CurrentUser() user: AuthUser, @Body() dto: CreateDataRelationDto) {
    return this.donneesService.createRelation(requireOrganisationId(user), dto);
  }

  @Delete('relations/:relationId')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRelation(@CurrentUser() user: AuthUser, @Param('relationId') relationId: string) {
    return this.donneesService.removeRelation(relationId, requireOrganisationId(user));
  }
}
