import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser, ApiPaginatedResponse, CurrentUser, PaginationQueryDto, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SolutionService } from './solution.service';
import { CreateSolutionDto } from './dto/create-solution.dto';
import { UpdateSolutionDto } from './dto/update-solution.dto';
import { UpdateScoresDto } from './dto/update-scores.dto';
import { SolutionEntity } from './entities/solution.entity';

@ApiTags('solutions')
@ApiBearerAuth('access-token')
@Controller('solutions')
export class SolutionController {
  constructor(private readonly service: SolutionService) {}

  @ApiOperation({ summary: 'Lister les solutions' })
  @Get()
  @ApiOkResponse({
    type: [SolutionEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(SolutionEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAll(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: 'Recuperer une solution par son identifiant' })
  @Get(':id')
  @ApiOkResponse({ type: SolutionEntity })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Creer une solution' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: SolutionEntity })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSolutionDto) {
    return this.service.create(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Mettre a jour une solution' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: SolutionEntity })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateSolutionDto) {
    return this.service.update(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: "Mettre a jour les scores d'evaluation d'une solution" })
  @Patch(':id/scores')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: SolutionEntity })
  updateScores(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateScoresDto) {
    return this.service.updateScores(id, requireOrganisationId(user), dto.items);
  }

  @ApiOperation({ summary: 'Supprimer une solution' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, requireOrganisationId(user));
  }
}
