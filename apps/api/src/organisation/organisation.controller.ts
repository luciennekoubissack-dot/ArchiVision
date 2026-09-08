import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrganisationService } from './organisation.service';
import { CompletudService } from './completude.service';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { AllowPendingOrganisation, AuthUser, CurrentUser, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { OrganisationEntity } from './entities/organisation.entity';
import { OrganisationExportEntity } from './entities/organisation-export.entity';

@ApiTags('organisations')
@ApiBearerAuth('access-token')
@Controller('organisations')
export class OrganisationController {
  constructor(
    private readonly organisationService: OrganisationService,
    private readonly completudService: CompletudService,
  ) {}

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

  @ApiOperation({
    summary: "Calcule les ratios AS-IS / TO-BE par domaine architectural et le score de maturité global.",
    description:
      "Retourne, pour chaque domaine (objectifs, métier, données, applicatif, technologique), " +
      "le nombre d'éléments AS-IS, le nombre ayant un successeur TO-BE, et le pourcentage de couverture. " +
      "Le champ `maturite` (0–100) pondère : 40% TO-BE moyen, 40% écarts couverts par des solutions, 20% solutions terminées.",
  })
  @Get('me/completude')
  completude(@CurrentUser() user: AuthUser) {
    return this.completudService.compute(requireOrganisationId(user));
  }

  @ApiOperation({
    summary: "Génère des suggestions TO-BE pour les éléments AS-IS sans cible déclarée.",
    description:
      "Analyse les éléments AS-IS de chaque domaine (objectifs, métier, données, applicatif, technologique) " +
      "et propose une suggestion de cible TO-BE pour chacun, contextualisée par la vision et les problèmes à résoudre. " +
      "Les suggestions sont déterministes (pas d'IA externe) et servent de point de départ pour compléter le référentiel.",
  })
  @Get('me/suggestions-tobe')
  suggestionsToBe(@CurrentUser() user: AuthUser) {
    return this.completudService.generateSuggestionsToBe(requireOrganisationId(user));
  }
}
