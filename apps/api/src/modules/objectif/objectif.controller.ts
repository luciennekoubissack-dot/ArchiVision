import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ObjectifService } from './objectif.service';
import { CreateObjectifDto } from './dto/create-objectif.dto';
import { UpdateObjectifDto } from './dto/update-objectif.dto';
import { AuthUser, CurrentUser, PaginationQueryDto, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';

@Controller('objectifs')
export class ObjectifController {
  constructor(private readonly service: ObjectifService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAll(requireOrganisationId(user), pagination);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(id, requireOrganisationId(user));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateObjectifDto) {
    return this.service.create(requireOrganisationId(user), dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateObjectifDto) {
    return this.service.update(id, requireOrganisationId(user), dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, requireOrganisationId(user));
  }
}
