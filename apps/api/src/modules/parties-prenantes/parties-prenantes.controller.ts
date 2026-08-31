import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, PaginationQueryDto, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '@archivision/shared';
import { PartiesPrenantesService } from './parties-prenantes.service';
import { CreatePartiePrenanteDto } from './dto/create-partie-prenante.dto';
import { PartiePrenanteEntity } from './entities/partie-prenante.entity';

@ApiTags('parties-prenantes')
@ApiBearerAuth('access-token')
@Controller('parties-prenantes')
export class PartiesPrenantesController {
  constructor(private readonly service: PartiesPrenantesService) {}

  @ApiOperation({ summary: 'Lister les parties prenantes' })
  @Get()
  @ApiOkResponse({
    type: [PartiePrenanteEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(PartiePrenanteEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAll(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: 'Créer une partie prenante' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: PartiePrenanteEntity })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePartiePrenanteDto) {
    return this.service.create(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprimer une partie prenante' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, requireOrganisationId(user));
  }
}
