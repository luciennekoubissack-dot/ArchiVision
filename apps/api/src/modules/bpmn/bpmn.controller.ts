import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { BpmnService } from './bpmn.service';
import { BpmnViewService } from './bpmn-view.service';
import { CreateBpmnProcessusDto } from './dto/create-bpmn-processus.dto';
import { UpdateBpmnProcessusDto } from './dto/update-bpmn-processus.dto';
import { CreateBpmnElementDto } from './dto/create-bpmn-element.dto';
import { UpdateBpmnElementDto } from './dto/update-bpmn-element.dto';
import { CreateBpmnFlowDto } from './dto/create-bpmn-flow.dto';

@Controller('bpmn-processus')
export class BpmnController {
  constructor(
    private readonly bpmnService: BpmnService,
    private readonly viewService: BpmnViewService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.bpmnService.findAll(requireOrganisationId(user));
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bpmnService.findOne(id, requireOrganisationId(user));
  }

  @Get(':id/generate-vue')
  generateVue(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.viewService.generate(id, requireOrganisationId(user));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBpmnProcessusDto) {
    return this.bpmnService.create(requireOrganisationId(user), dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateBpmnProcessusDto) {
    return this.bpmnService.update(id, requireOrganisationId(user), dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bpmnService.remove(id, requireOrganisationId(user));
  }

  @Post(':id/elements')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  addElement(@CurrentUser() user: AuthUser, @Param('id') processusId: string, @Body() dto: CreateBpmnElementDto) {
    return this.bpmnService.addElement(processusId, requireOrganisationId(user), dto);
  }

  @Patch('elements/:elementId')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  updateElement(
    @CurrentUser() user: AuthUser,
    @Param('elementId') elementId: string,
    @Body() dto: UpdateBpmnElementDto,
  ) {
    return this.bpmnService.updateElement(elementId, requireOrganisationId(user), dto);
  }

  @Delete('elements/:elementId')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeElement(@CurrentUser() user: AuthUser, @Param('elementId') elementId: string) {
    return this.bpmnService.removeElement(elementId, requireOrganisationId(user));
  }

  @Post(':id/flows')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  addFlow(@CurrentUser() user: AuthUser, @Param('id') processusId: string, @Body() dto: CreateBpmnFlowDto) {
    return this.bpmnService.addFlow(processusId, requireOrganisationId(user), dto);
  }

  @Delete('flows/:flowId')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFlow(@CurrentUser() user: AuthUser, @Param('flowId') flowId: string) {
    return this.bpmnService.removeFlow(flowId, requireOrganisationId(user));
  }
}
