import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AllowPendingOrganisation, CurrentUser, AuthUser, Public, clearAuthCookies, setAuthCookies } from '@archivision/shared';
import { AuthResponseEntity, MessageResponseEntity, RegisterResponseEntity } from './entities/auth-response.entity';
import { MeEntity } from './entities/me.entity';

// 5 tentatives / minute / IP : marge confortable pour un usage légitime
// (fautes de frappe incluses) tout en freinant un brute force sur le mot de passe.
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

// Endpoints atteints sans session, susceptibles d'être ciblés par un
// balayage de jetons ou une énumération d'e-mails : même limite stricte que
// login/register.
const RESET_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

/** Message générique, identique que le compte existe ou non (pas d'énumération d'e-mails). */
const FORGOT_PASSWORD_MESSAGE =
  'Si un compte existe avec cette adresse, un e-mail de réinitialisation vient de lui être envoyé.';

class LoginDto {
  @ApiProperty({ description: 'Adresse e-mail de l\'utilisateur.' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Mot de passe, 8 caractères minimum.' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Inscrit une nouvelle organisation et son premier utilisateur administrateur.' })
  @Post('register')
  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: RegisterResponseEntity })
  async register(@Body() dto: RegisterDto) {
    // Pas de session à l'inscription : l'organisation démarre EN_ATTENTE et
    // ne peut accéder à l'application qu'une fois validée par le superadmin.
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Connecte un utilisateur avec son e-mail et son mot de passe.' })
  @Post('login')
  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseEntity })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto.email, dto.password);
    setAuthCookies(res, result.accessToken);
    return result;
  }

  @ApiOperation({ summary: 'Déconnecte l\'utilisateur en effaçant les cookies d\'authentification.' })
  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookies(res);
  }

  @ApiOperation({ summary: "Demande un e-mail de réinitialisation de mot de passe." })
  @Post('forgot-password')
  @Public()
  @Throttle(RESET_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MessageResponseEntity })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<MessageResponseEntity> {
    await this.authService.forgotPassword(dto.email);
    // Toujours le même message, que le compte existe ou non.
    return { message: FORGOT_PASSWORD_MESSAGE };
  }

  @ApiOperation({ summary: "Réinitialise le mot de passe à partir du jeton reçu par e-mail et ouvre la session." })
  @Post('reset-password')
  @Public()
  @Throttle(RESET_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseEntity })
  async resetPassword(@Body() dto: ResetPasswordDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.resetPassword(dto.token, dto.password);
    setAuthCookies(res, result.accessToken);
    return result;
  }

  @ApiOperation({ summary: 'Récupère le profil de l\'utilisateur courant.' })
  @ApiBearerAuth('access-token')
  @Get('me')
  @AllowPendingOrganisation()
  @ApiOkResponse({ type: MeEntity })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.sub);
  }

  @ApiOperation({ summary: 'Met à jour le profil de l\'utilisateur courant.' })
  @ApiBearerAuth('access-token')
  @Patch('me')
  @ApiOkResponse({ type: MeEntity })
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(user.sub, dto);
  }
}
