import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceService } from './service.service';
import { ServiceViewService } from './service-view.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AuthUser, CurrentUser, requireOrganisationId } from '@archivision/shared';
import { ServiceEntity, ServiceTitulaireRefEntity } from './entities/service.entity';
import { ServiceViewEntity } from './entities/service-view.entity';

@ApiTags('services')
@ApiBearerAuth('access-token')
@Controller('services')
export class ServiceController {
  constructor(
    private readonly service: ServiceService,
    private readonly viewService: ServiceViewService,
  ) {}

  @ApiOperation({ summary: 'Crée un nouveau service.' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: ServiceEntity })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateServiceDto) {
    return this.service.create(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Liste les services de l\'organisation.' })
  @Get()
  @ApiOkResponse({ type: [ServiceEntity] })
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Génère la vue de l\'organigramme des services.' })
  @Get('generate-vue')
  @ApiOkResponse({ type: ServiceViewEntity })
  generateVue(@CurrentUser() user: AuthUser) {
    return this.viewService.generate(requireOrganisationId(user));
  }

  @ApiOperation({ summary: "Liste les membres de l'organisation (id + nom) pour choisir un titulaire." })
  @Get('membres')
  @ApiOkResponse({ type: [ServiceTitulaireRefEntity] })
  listMembres(@CurrentUser() user: AuthUser) {
    return this.service.listMembres(requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Récupère un service par son identifiant.' })
  @Get(':id')
  @ApiOkResponse({ type: ServiceEntity })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Met à jour un service.' })
  @Patch(':id')
  @ApiOkResponse({ type: ServiceEntity })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.service.update(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprime un service.' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, requireOrganisationId(user));
  }
}
