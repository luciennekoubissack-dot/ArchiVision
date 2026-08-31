import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { ArchitectureApplicativeService } from './architecture-applicative.service';
import { ArchitectureApplicativeViewService } from './architecture-applicative-view.service';
import { CreateArchiApplicativeElementDto } from './dto/create-element.dto';
import { UpdateArchiApplicativeElementDto } from './dto/update-element.dto';
import { CreateArchiApplicativeFluxDto } from './dto/create-flux.dto';
import { ArchiApplicativeElementEntity } from './entities/archi-applicative-element.entity';
import { ArchiApplicativeFluxEntity, ArchiApplicativeFluxWithElementsEntity } from './entities/archi-applicative-flux.entity';
import { ArchitectureApplicativeVueEntity } from './entities/architecture-applicative-vue.entity';

@ApiTags('architecture-applicative')
@ApiBearerAuth('access-token')
@Controller('architecture-applicative')
export class ArchitectureApplicativeController {
  constructor(
    private readonly service: ArchitectureApplicativeService,
    private readonly viewService: ArchitectureApplicativeViewService,
  ) {}

  @ApiOperation({ summary: "Lister les éléments d'architecture applicative de l'organisation." })
  @Get('elements')
  @ApiOkResponse({ type: [ArchiApplicativeElementEntity] })
  findAllElements(@CurrentUser() user: AuthUser) {
    return this.service.findAllElements(requireOrganisationId(user));
  }

  @ApiOperation({ summary: "Générer la vue d'architecture applicative de l'organisation." })
  @Get('generate-vue')
  @ApiOkResponse({ type: ArchitectureApplicativeVueEntity })
  generateVue(@CurrentUser() user: AuthUser) {
    return this.viewService.generate(requireOrganisationId(user));
  }

  @ApiOperation({ summary: "Créer un élément d'architecture applicative." })
  @Post('elements')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: ArchiApplicativeElementEntity })
  createElement(@CurrentUser() user: AuthUser, @Body() dto: CreateArchiApplicativeElementDto) {
    return this.service.createElement(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: "Mettre à jour un élément d'architecture applicative." })
  @Patch('elements/:id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: ArchiApplicativeElementEntity })
  updateElement(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateArchiApplicativeElementDto) {
    return this.service.updateElement(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: "Supprimer un élément d'architecture applicative." })
  @Delete('elements/:id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeElement(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeElement(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Lister les flux entre éléments d\'architecture applicative.' })
  @Get('flux')
  @ApiOkResponse({ type: [ArchiApplicativeFluxWithElementsEntity] })
  findAllFlux(@CurrentUser() user: AuthUser) {
    return this.service.findAllFlux(requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Créer un flux entre deux éléments.' })
  @Post('flux')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: ArchiApplicativeFluxEntity })
  createFlux(@CurrentUser() user: AuthUser, @Body() dto: CreateArchiApplicativeFluxDto) {
    return this.service.createFlux(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprimer un flux.' })
  @Delete('flux/:id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeFlux(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.removeFlux(id, requireOrganisationId(user));
  }
}
