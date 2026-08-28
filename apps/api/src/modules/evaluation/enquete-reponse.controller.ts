import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, PaginationQueryDto, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { EnqueteReponseService } from './enquete-reponse.service';
import { ImportEnqueteDto } from './dto/import-enquete.dto';

@Controller('enquete-reponses')
export class EnqueteReponseController {
  constructor(private readonly service: EnqueteReponseService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.service.findAll(requireOrganisationId(user), pagination);
  }

  @Post('import')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.CREATED)
  import(@CurrentUser() user: AuthUser, @Body() dto: ImportEnqueteDto) {
    return this.service.importReponses(requireOrganisationId(user), dto.items);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, requireOrganisationId(user));
  }
}
