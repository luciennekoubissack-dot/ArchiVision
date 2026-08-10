import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { RoadmapService } from './roadmap.service';
import { CreateProjetDto } from './dto/create-projet.dto';
import { UpdateProjetDto } from './dto/update-projet.dto';

@Controller('projets')
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.roadmapService.findAll(requireOrganisationId(user));
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.roadmapService.findOne(id, requireOrganisationId(user));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjetDto) {
    return this.roadmapService.create(requireOrganisationId(user), dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateProjetDto) {
    return this.roadmapService.update(id, requireOrganisationId(user), dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.roadmapService.remove(id, requireOrganisationId(user));
  }
}
