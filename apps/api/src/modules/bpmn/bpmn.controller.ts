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
import { BpmnService } from './bpmn.service';
import { BpmnViewService } from './bpmn-view.service';
import { CreateBpmnProcessusDto } from './dto/create-bpmn-processus.dto';
import { UpdateBpmnProcessusDto } from './dto/update-bpmn-processus.dto';
import { CreateBpmnElementDto } from './dto/create-bpmn-element.dto';
import { UpdateBpmnElementDto } from './dto/update-bpmn-element.dto';
import { CreateBpmnFlowDto } from './dto/create-bpmn-flow.dto';
import { BpmnProcessusEntity } from './entities/bpmn-processus.entity';
import { BpmnProcessusListItemEntity } from './entities/bpmn-processus-list-item.entity';
import { BpmnProcessusDetailEntity } from './entities/bpmn-processus-detail.entity';
import { BpmnElementEntity } from './entities/bpmn-element.entity';
import { BpmnFlowEntity } from './entities/bpmn-flow.entity';
import { BpmnViewResultEntity } from './entities/bpmn-view-result.entity';

@ApiTags('bpmn-processus')
@ApiBearerAuth('access-token')
@Controller('bpmn-processus')
export class BpmnController {
  constructor(
    private readonly bpmnService: BpmnService,
    private readonly viewService: BpmnViewService,
  ) {}

  @ApiOperation({ summary: 'Lister les processus BPMN de l\'organisation' })
  @Get()
  @ApiOkResponse({
    type: [BpmnProcessusListItemEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(BpmnProcessusListItemEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.bpmnService.findAll(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: 'Recuperer un processus BPMN par son identifiant' })
  @Get(':id')
  @ApiOkResponse({ type: BpmnProcessusDetailEntity })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bpmnService.findOne(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Generer la vue du processus BPMN' })
  @Get(':id/generate-vue')
  @ApiOkResponse({ type: BpmnViewResultEntity })
  generateVue(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.viewService.generate(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Creer un nouveau processus BPMN' })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: BpmnProcessusEntity })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBpmnProcessusDto) {
    return this.bpmnService.create(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Mettre a jour un processus BPMN' })
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: BpmnProcessusEntity })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateBpmnProcessusDto) {
    return this.bpmnService.update(id, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprimer un processus BPMN' })
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bpmnService.remove(id, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Ajouter un element a un processus BPMN' })
  @Post(':id/elements')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: BpmnElementEntity })
  addElement(@CurrentUser() user: AuthUser, @Param('id') processusId: string, @Body() dto: CreateBpmnElementDto) {
    return this.bpmnService.addElement(processusId, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Mettre a jour un element BPMN' })
  @Patch('elements/:elementId')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: BpmnElementEntity })
  updateElement(
    @CurrentUser() user: AuthUser,
    @Param('elementId') elementId: string,
    @Body() dto: UpdateBpmnElementDto,
  ) {
    return this.bpmnService.updateElement(elementId, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprimer un element BPMN' })
  @Delete('elements/:elementId')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeElement(@CurrentUser() user: AuthUser, @Param('elementId') elementId: string) {
    return this.bpmnService.removeElement(elementId, requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Ajouter un flux entre deux elements BPMN' })
  @Post(':id/flows')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: BpmnFlowEntity })
  addFlow(@CurrentUser() user: AuthUser, @Param('id') processusId: string, @Body() dto: CreateBpmnFlowDto) {
    return this.bpmnService.addFlow(processusId, requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprimer un flux BPMN' })
  @Delete('flows/:flowId')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  removeFlow(@CurrentUser() user: AuthUser, @Param('flowId') flowId: string) {
    return this.bpmnService.removeFlow(flowId, requireOrganisationId(user));
  }
}
