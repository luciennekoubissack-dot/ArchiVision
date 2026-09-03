import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, setAuthCookies } from '@archivision/shared';
import { InvitationService } from './invitation.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InvitationPublicEntity } from './entities/invitation-public.entity';
import { AuthResponseEntity } from '../auth/entities/auth-response.entity';

// Endpoints atteints sans session (la personne invitée n'a pas encore de
// compte) : limite stricte pour empêcher le balayage de jetons.
const INVITATION_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('invitations')
@Controller('invitations')
export class InvitationPublicController {
  constructor(private readonly invitationService: InvitationService) {}

  @ApiOperation({ summary: "Détails d'une invitation à partir de son jeton (page « Rejoindre »)." })
  @Get('token/:token')
  @Public()
  @Throttle(INVITATION_THROTTLE)
  @ApiOkResponse({ type: InvitationPublicEntity })
  findByToken(@Param('token') token: string) {
    return this.invitationService.findByToken(token);
  }

  @ApiOperation({ summary: "Accepter une invitation : crée le compte et ouvre la session." })
  @Post('accept')
  @Public()
  @Throttle(INVITATION_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseEntity })
  async accept(@Body() dto: AcceptInvitationDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.invitationService.accept(dto);
    setAuthCookies(res, result.accessToken);
    return result;
  }
}
