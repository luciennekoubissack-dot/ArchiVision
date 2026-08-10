import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MembresService } from './membres.service';
import { CreateMembreDto } from './dto/create-membre.dto';
import { UpdateMembreDto } from './dto/update-membre.dto';
import { AuthUser, CurrentUser, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';

@Controller('membres')
@UseGuards(RolesGuard)
@Roles(RoleUtilisateur.ADMINISTRATEUR)
export class MembresController {
  constructor(private readonly membresService: MembresService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.membresService.findAll(requireOrganisationId(user));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMembreDto) {
    return this.membresService.create(requireOrganisationId(user), dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateMembreDto) {
    return this.membresService.update(requireOrganisationId(user), id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    await this.membresService.remove(requireOrganisationId(user), id);
  }
}
