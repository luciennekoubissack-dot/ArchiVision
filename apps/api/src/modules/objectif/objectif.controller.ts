import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ObjectifService } from './objectif.service';
import { CreateObjectifDto } from './dto/create-objectif.dto';
import { UpdateObjectifDto } from './dto/update-objectif.dto';
import { AuthUser, CurrentUser, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';

@Controller('objectifs')
export class ObjectifController {
  constructor(private readonly service: ObjectifService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.organisationId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(id, user.organisationId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ARCHITECTE, RoleUtilisateur.DIRIGEANT)
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateObjectifDto) {
    return this.service.create(user.organisationId, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ARCHITECTE, RoleUtilisateur.DIRIGEANT)
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateObjectifDto) {
    return this.service.update(id, user.organisationId, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ARCHITECTE, RoleUtilisateur.DIRIGEANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, user.organisationId);
  }
}
