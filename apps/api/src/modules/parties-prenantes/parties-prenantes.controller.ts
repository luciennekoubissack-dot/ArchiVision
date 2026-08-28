import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, PaginationQueryDto, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { PartiesPrenantesService } from './parties-prenantes.service';
import { CreatePartiePrenanteDto } from './dto/create-partie-prenante.dto';

@Controller('parties-prenantes')
export class PartiesPrenantesController {
  constructor(private readonly service: PartiesPrenantesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAll(requireOrganisationId(user), pagination);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePartiePrenanteDto) {
    return this.service.create(requireOrganisationId(user), dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, requireOrganisationId(user));
  }
}
