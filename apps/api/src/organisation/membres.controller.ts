import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '@archivision/shared';
import { MembresService } from './membres.service';
import { CreateMembreDto } from './dto/create-membre.dto';
import { UpdateMembreDto } from './dto/update-membre.dto';
import { AuthUser, CurrentUser, PaginationQueryDto, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { MembreEntity } from './entities/membre.entity';

@ApiTags('membres')
@ApiBearerAuth('access-token')
@Controller('membres')
@UseGuards(RolesGuard)
@Roles(RoleUtilisateur.ADMINISTRATEUR)
export class MembresController {
  constructor(private readonly membresService: MembresService) {}

  @ApiOperation({ summary: "Lister les membres de l'organisation." })
  @Get()
  @ApiOkResponse({
    type: [MembreEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(MembreEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.membresService.findAll(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: 'Créer un membre dans l\'organisation.' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: MembreEntity })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMembreDto) {
    return this.membresService.create(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Mettre à jour un membre.' })
  @Patch(':id')
  @ApiOkResponse({ type: MembreEntity })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateMembreDto) {
    return this.membresService.update(requireOrganisationId(user), id, dto);
  }

  @ApiOperation({ summary: 'Supprimer un membre.' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    await this.membresService.remove(requireOrganisationId(user), id);
  }
}
