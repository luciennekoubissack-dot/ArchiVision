import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrganisationService } from './organisation.service';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { AllowPendingOrganisation, AuthUser, CurrentUser, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { OrganisationEntity } from './entities/organisation.entity';
import { OrganisationExportEntity } from './entities/organisation-export.entity';

@ApiTags('organisations')
@ApiBearerAuth('access-token')
@Controller('organisations')
export class OrganisationController {
  constructor(private readonly organisationService: OrganisationService) {}

  @ApiOperation({ summary: "Récupérer l'organisation de l'utilisateur courant." })
  @Get('me')
  @AllowPendingOrganisation()
  @ApiOkResponse({ type: OrganisationEntity })
  findMine(@CurrentUser() user: AuthUser) {
    return this.organisationService.findMine(requireOrganisationId(user));
  }

  @ApiOperation({ summary: "Mettre à jour l'organisation de l'utilisateur courant." })
  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: OrganisationEntity })
  updateMine(@CurrentUser() user: AuthUser, @Body() dto: UpdateOrganisationDto) {
    return this.organisationService.updateMine(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: "Exporter le référentiel de l'organisation de l'utilisateur courant." })
  @Get('me/export')
  @ApiOkResponse({ type: OrganisationExportEntity })
  exportMine(@CurrentUser() user: AuthUser) {
    return this.organisationService.exportReferentiel(requireOrganisationId(user));
  }
}
