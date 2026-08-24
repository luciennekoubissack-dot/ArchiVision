import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, requireOrganisationId, Roles, RolesGuard } from '@archivision/shared';
import { RoleUtilisateur } from '@prisma/client';
import { VisionCanvasService } from './vision-canvas.service';
import { UpdateVisionCanvasDto } from './dto/update-vision-canvas.dto';

@Controller('vision-canvas')
export class VisionCanvasController {
  constructor(private readonly service: VisionCanvasService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.service.get(requireOrganisationId(user));
  }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles(RoleUtilisateur.ADMINISTRATEUR, RoleUtilisateur.ARCHITECTE)
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateVisionCanvasDto) {
    return this.service.update(requireOrganisationId(user), dto);
  }
}
