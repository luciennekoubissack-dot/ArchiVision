import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RoleUtilisateur, StatutOrganisation } from '@prisma/client';
import { Roles, RolesGuard, SuperAdminRoute } from '@archivision/shared';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles(RoleUtilisateur.SUPERADMIN)
@SuperAdminRoute()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('organisations')
  listOrganisations(@Query('statut') statut?: StatutOrganisation) {
    return this.adminService.listOrganisations(statut);
  }

  @Get('organisations/:id')
  getOrganisation(@Param('id') id: string) {
    return this.adminService.getOrganisation(id);
  }

  @Post('organisations/:id/valider')
  @HttpCode(HttpStatus.OK)
  valider(@Param('id') id: string) {
    return this.adminService.valider(id);
  }

  @Post('organisations/:id/rejeter')
  @HttpCode(HttpStatus.OK)
  rejeter(@Param('id') id: string) {
    return this.adminService.rejeter(id);
  }

  @Delete('organisations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.adminService.remove(id);
  }

  @Get('utilisateurs')
  listUtilisateurs() {
    return this.adminService.listUtilisateurs();
  }

  @Get('stats')
  stats() {
    return this.adminService.stats();
  }
}
