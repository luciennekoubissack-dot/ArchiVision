import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VisionCanvasService } from './vision-canvas.service';
import { UpdateVisionCanvasDto } from './dto/update-vision-canvas.dto';
import { VisionCanvasEntity } from './entities/vision-canvas.entity';

@ApiTags('vision-canvas')
@ApiBearerAuth('access-token')
@Controller('vision-canvas')
export class VisionCanvasController {
  constructor(private readonly service: VisionCanvasService) {}

  @ApiOperation({ summary: "Recuperer le vision canvas de l'organisation" })
  @Get()
  @ApiOkResponse({ type: VisionCanvasEntity })
  get(@CurrentUser() user: AuthUser) {
    return this.service.get(requireOrganisationId(user));
  }

  @ApiOperation({ summary: 'Mettre a jour le vision canvas' })
  @Patch()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  @ApiOkResponse({ type: VisionCanvasEntity })
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateVisionCanvasDto) {
    return this.service.update(requireOrganisationId(user), dto);
  }
}
