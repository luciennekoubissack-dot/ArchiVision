import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser, ApiPaginatedResponse, CurrentUser, PaginationQueryDto, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CritereEvaluationService } from './critere-evaluation.service';
import { CreateCritereEvaluationDto } from './dto/create-critere-evaluation.dto';
import { CritereEvaluationEntity } from './entities/critere-evaluation.entity';

@ApiTags('criteres-evaluation')
@ApiBearerAuth('access-token')
@Controller('criteres-evaluation')
export class CritereEvaluationController {
  constructor(private readonly service: CritereEvaluationService) {}

  @ApiOperation({ summary: "Lister les criteres d'evaluation" })
  @Get()
  @ApiOkResponse({
    type: [CritereEvaluationEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(CritereEvaluationEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAll(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: "Creer un critere d'evaluation" })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: CritereEvaluationEntity })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCritereEvaluationDto) {
    return this.service.create(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: "Supprimer un critere d'evaluation" })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, requireOrganisationId(user));
  }
}
