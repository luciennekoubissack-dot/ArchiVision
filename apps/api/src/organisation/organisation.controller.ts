import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { AuthUser, CurrentUser, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';

@Controller('organisations')
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  @Get('me')
  findMine(@CurrentUser() user: AuthUser) {
    return this.organisationService.findMine(requireOrganisationId(user));
  }

  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  updateMine(@CurrentUser() user: AuthUser, @Body() dto: UpdateOrganisationDto) {
    return this.organisationService.updateMine(requireOrganisationId(user), dto);
  }

  @Get('me/export')
  exportMine(@CurrentUser() user: AuthUser) {
    return this.organisationService.exportReferentiel(requireOrganisationId(user));
  }
}
