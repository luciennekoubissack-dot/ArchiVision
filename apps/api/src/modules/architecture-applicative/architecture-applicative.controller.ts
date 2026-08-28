import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { ArchitectureApplicativeService } from './architecture-applicative.service';
import { ArchitectureApplicativeViewService } from './architecture-applicative-view.service';
import { CreateArchiApplicativeElementDto } from './dto/create-element.dto';
import { UpdateArchiApplicativeElementDto } from './dto/update-element.dto';
import { CreateArchiApplicativeFluxDto } from './dto/create-flux.dto';

@Controller('architecture-applicative')
export class ArchitectureApplicativeController {
  constructor(
    private readonly service: ArchitectureApplicativeService,
    private readonly viewService: ArchitectureApplicativeViewService,
  ) {}

  @Get('elements')
  findAllElements(@CurrentUser() user: AuthUser) {
    return this.service.findAllElements(requireOrganisationId(user));
  }

  @Get('generate-vue')
  generateVue(@CurrentUser() user: AuthUser) {
    return this.viewService.generate(requireOrganisationId(user));
  }

  @Post('elements')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  createElement(@CurrentUser() user: AuthUser, @Body() dto: CreateArchiApplicativeElementDto) {
    return this.service.createElement(requireOrganisationId(user), dto);
  }

  @Patch('elements/:id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  updateElement(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateArchiApplicativeElementDto) {
    return this.service.updateElement(id, requireOrganisationId(user), dto);
  }

  @Delete('elements/:id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeElement(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeElement(id, requireOrganisationId(user));
  }

  @Get('flux')
  findAllFlux(@CurrentUser() user: AuthUser) {
    return this.service.findAllFlux(requireOrganisationId(user));
  }

  @Post('flux')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  createFlux(@CurrentUser() user: AuthUser, @Body() dto: CreateArchiApplicativeFluxDto) {
    return this.service.createFlux(requireOrganisationId(user), dto);
  }

  @Delete('flux/:id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFlux(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeFlux(id, requireOrganisationId(user));
  }
}
