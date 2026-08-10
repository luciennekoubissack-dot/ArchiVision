import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { TechnologieService } from './technologie.service';
import { CreateTechComponentDto } from './dto/create-tech-component.dto';
import { UpdateTechComponentDto } from './dto/update-tech-component.dto';
import { DeployerApplicationDto } from './dto/deployer-application.dto';

@Controller('tech-components')
export class TechnologieController {
  constructor(private readonly technologieService: TechnologieService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.technologieService.findAll(requireOrganisationId(user));
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.technologieService.findOne(id, requireOrganisationId(user));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTechComponentDto) {
    return this.technologieService.create(requireOrganisationId(user), dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateTechComponentDto) {
    return this.technologieService.update(id, requireOrganisationId(user), dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.technologieService.remove(id, requireOrganisationId(user));
  }

  @Post('deployer')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  deployer(@CurrentUser() user: AuthUser, @Body() dto: DeployerApplicationDto) {
    return this.technologieService.deployer(requireOrganisationId(user), dto);
  }

  @Delete(':techComponentId/applications/:applicationId')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  undeployer(
    @CurrentUser() user: AuthUser,
    @Param('techComponentId') techComponentId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.technologieService.undeployer(applicationId, techComponentId, requireOrganisationId(user));
  }
}
