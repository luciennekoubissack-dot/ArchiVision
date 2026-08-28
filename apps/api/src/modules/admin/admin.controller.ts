import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RoleUtilisateur } from '@prisma/client';
import { PaginationQueryDto, Roles, RolesGuard, SuperAdminRoute } from '@archivision/shared';
import { AdminService } from './admin.service';
import { ListOrganisationsQueryDto } from './dto/list-organisations-query.dto';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles(RoleUtilisateur.SUPERADMIN)
@SuperAdminRoute()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('organisations')
  listOrganisations(@Query() query: ListOrganisationsQueryDto) {
    return this.adminService.listOrganisations(query.statut, query);
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
  listUtilisateurs(@Query() pagination: PaginationQueryDto) {
    return this.adminService.listUtilisateurs(pagination);
  }

  @Get('stats')
  stats() {
    return this.adminService.stats();
  }
}
