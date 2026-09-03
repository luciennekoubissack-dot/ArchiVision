import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@archivision/infrastructure';
import { requireJwtSecret } from '@archivision/shared';
import { MailModule } from '../mail/mail.module';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';
import { InvitationPublicController } from './invitation-public.controller';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    // Même configuration JWT que l'AuthModule : l'acceptation d'une invitation
    // ouvre une session exactement comme une connexion.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: requireJwtSecret(config),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [InvitationController, InvitationPublicController],
  providers: [InvitationService],
})
export class InvitationModule {}
