import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleUtilisateur } from '@prisma/client';
import {
  ApiPaginatedResponse,
  AuthUser,
  CurrentUser,
  PaginationQueryDto,
  Roles,
  RolesGuard,
  requireOrganisationId,
} from '@archivision/shared';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { InvitationEntity } from './entities/invitation.entity';

@ApiTags('invitations')
@ApiBearerAuth('access-token')
@Controller('invitations')
@UseGuards(RolesGuard)
@Roles(RoleUtilisateur.ADMINISTRATEUR)
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @ApiOperation({ summary: "Lister les invitations en attente de l'organisation." })
  @Get()
  @ApiOkResponse({
    type: [InvitationEntity],
    description: "Tableau complet si aucune pagination n'est demandée (voir aussi la réponse paginée ci-dessous).",
  })
  @ApiPaginatedResponse(InvitationEntity)
  findAll(@CurrentUser() user: AuthUser, @Query() pagination: PaginationQueryDto) {
    return this.invitationService.list(requireOrganisationId(user), pagination);
  }

  @ApiOperation({ summary: "Inviter une personne à rejoindre l'organisation par e-mail." })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: InvitationEntity })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInvitationDto) {
    return this.invitationService.create(requireOrganisationId(user), user.sub, dto);
  }

  @ApiOperation({ summary: "Renvoyer l'e-mail d'invitation avec un nouveau lien." })
  @Post(':id/renvoyer')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: InvitationEntity })
  resend(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invitationService.resend(requireOrganisationId(user), id);
  }

  @ApiOperation({ summary: "Révoquer une invitation en attente." })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async revoke(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    await this.invitationService.revoke(requireOrganisationId(user), id);
  }
}
