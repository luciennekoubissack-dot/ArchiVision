import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CanevasService } from './canevas.service';
import { CreateCanevasRelationDto } from './dto/create-canevas-relation.dto';
import { AuthUser, CurrentUser, requireOrganisationId } from '@archivision/shared';

@Controller('canevas-relations')
export class CanevasController {
  constructor(private readonly service: CanevasService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(requireOrganisationId(user));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCanevasRelationDto) {
    return this.service.createRelation(requireOrganisationId(user), dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, requireOrganisationId(user));
  }
}
