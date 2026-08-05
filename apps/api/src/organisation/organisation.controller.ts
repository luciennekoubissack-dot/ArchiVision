import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { AuthUser, CurrentUser, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';

@Controller('organisations')
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  @Get('me')
  findMine(@CurrentUser() user: AuthUser) {
    return this.organisationService.findMine(user.organisationId);
  }

  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ARCHITECTE, RoleUtilisateur.DIRIGEANT)
  updateMine(@CurrentUser() user: AuthUser, @Body() dto: UpdateOrganisationDto) {
    return this.organisationService.updateMine(user.organisationId, dto);
  }

  @Get('me/export')
  exportMine(@CurrentUser() user: AuthUser) {
    return this.organisationService.exportReferentiel(user.organisationId);
  }
}
