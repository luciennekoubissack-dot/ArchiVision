import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CanevasService } from './canevas.service';
import { CreateCanevasRelationDto } from './dto/create-canevas-relation.dto';
import { AuthUser, CurrentUser, requireOrganisationId } from '@archivision/shared';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CanevasRelationEntity } from './entities/canevas-relation.entity';

@ApiTags('canevas-relations')
@ApiBearerAuth('access-token')
@Controller('canevas-relations')
export class CanevasController {
  constructor(private readonly service: CanevasService) {}

  @ApiOperation({ summary: 'Lister les relations du canevas' })
  @Get()
  @ApiOkResponse({ type: [CanevasRelationEntity] })
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Créer une relation entre deux éléments du canevas' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: CanevasRelationEntity })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCanevasRelationDto) {
    return this.service.createRelation(requireOrganisationId(user), dto);
  }

  @ApiOperation({ summary: 'Supprimer une relation du canevas' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(id, requireOrganisationId(user));
  }
}
