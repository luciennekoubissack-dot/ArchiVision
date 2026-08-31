import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser, ApiPaginatedResponse, CurrentUser, PaginationQueryDto, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PolitiqueService } from './politique.service';
import { CreatePolitiqueDto } from './dto/create-politique.dto';
import { UpdatePolitiqueDto } from './dto/update-politique.dto';
import { PolitiqueEntity } from './entities/politique.entity';

@ApiTags('politiques-gouvernance')
@ApiBearerAuth('access-token')
@Controller('politiques-gouvernance')
export class PolitiqueController {
  constructor(private readonly service: PolitiqueService) {}

  @ApiOperation({ summary: 'Lister les politiques de gouvernance' })
  @Get()
  @ApiOkResponse({
    type: [PolitiqueEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(PolitiqueEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAll(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: 'Creer une politique de gouvernance' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: PolitiqueEntity })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePolitiqueDto) {
    return this.service.create(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Mettre a jour une politique de gouvernance' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: PolitiqueEntity })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePolitiqueDto) {
    return this.service.update(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprimer une politique de gouvernance' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, requireOrganisationId(user));
  }
}
