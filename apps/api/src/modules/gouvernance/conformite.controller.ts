import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthUser, ApiPaginatedResponse, CurrentUser, PaginationQueryDto, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConformiteService } from './conformite.service';
import { UpdateConformitesDto } from './dto/update-conformites.dto';
import { ConformiteBySolutionEntity, ConformiteEntity } from './entities/conformite.entity';

@ApiTags('conformites-solutions')
@ApiBearerAuth('access-token')
@Controller('conformites-solutions')
export class ConformiteController {
  constructor(private readonly service: ConformiteService) {}

  @ApiOperation({ summary: 'Lister les conformites des solutions' })
  @Get()
  @ApiOkResponse({
    type: [ConformiteEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(ConformiteEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAll(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: "Recuperer les conformites d'une solution" })
  @Get(':solutionId')
  @ApiOkResponse({ type: [ConformiteBySolutionEntity] })
  findBySolution(@CurrentUser() user: AuthUser, @Param('solutionId') solutionId: string) {
    return this.service.findBySolution(solutionId, requireOrganisationId(user));
  }

  @ApiOperation({ summary: "Mettre a jour les conformites d'une solution" })
  @Patch(':solutionId')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: [ConformiteBySolutionEntity] })
  update(@CurrentUser() user: AuthUser, @Param('solutionId') solutionId: string, @Body() dto: UpdateConformitesDto) {
    return this.service.updateConformites(solutionId, requireOrganisationId(user), dto.items);
  }
}
