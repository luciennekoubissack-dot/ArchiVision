import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, PaginationQueryDto, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { ConformiteService } from './conformite.service';
import { UpdateConformitesDto } from './dto/update-conformites.dto';

@Controller('conformites-solutions')
export class ConformiteController {
  constructor(private readonly service: ConformiteService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAll(requireOrganisationId(user), pagination);
  }

  @Get(':solutionId')
  findBySolution(@CurrentUser() user: AuthUser, @Param('solutionId') solutionId: string) {
    return this.service.findBySolution(solutionId, requireOrganisationId(user));
  }

  @Patch(':solutionId')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  update(@CurrentUser() user: AuthUser, @Param('solutionId') solutionId: string, @Body() dto: UpdateConformitesDto) {
    return this.service.updateConformites(solutionId, requireOrganisationId(user), dto.items);
  }
}
