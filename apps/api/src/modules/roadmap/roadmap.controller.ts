import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, PaginationQueryDto, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '@archivision/shared';
import { RoadmapService } from './roadmap.service';
import { CreateProjetDto } from './dto/create-projet.dto';
import { UpdateProjetDto } from './dto/update-projet.dto';
import { ProjetEntity } from './entities/projet.entity';

@ApiTags('projets')
@ApiBearerAuth('access-token')
@Controller('projets')
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @ApiOperation({ summary: 'Liste les projets de la roadmap' })
  @Get()
  @ApiOkResponse({
    type: [ProjetEntity],
    description: "Tableau complet si aucune pagination n'est demandee (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(ProjetEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.roadmapService.findAll(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: 'Recupere un projet par son identifiant' })
  @Get(':id')
  @ApiOkResponse({ type: ProjetEntity })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.roadmapService.findOne(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Cree un nouveau projet' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: ProjetEntity })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProjetDto) {
    return this.roadmapService.create(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Met a jour un projet' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: ProjetEntity })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateProjetDto) {
    return this.roadmapService.update(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprime un projet' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.roadmapService.remove(id, requireOrganisationId(user));
  }
}
