import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '@archivision/infrastructure';
import { JwtAuthGuard } from '@archivision/shared';
import { OrganisationModule } from './organisation/organisation.module';
import { AuthModule } from './modules/auth/auth.module';
import { ArchimateModule } from './modules/archimate/archimate.module';
import { UrbanisationModule } from './modules/urbanisation/urbanisation.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    PrismaModule,
    AuthModule,
    OrganisationModule,
    ArchimateModule,
    UrbanisationModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
