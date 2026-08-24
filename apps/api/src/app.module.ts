import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '@archivision/infrastructure';
import { JwtAuthGuard, SuperAdminGuard } from '@archivision/shared';
import { OrganisationModule } from './organisation/organisation.module';
import { AuthModule } from './modules/auth/auth.module';
import { ArchimateModule } from './modules/archimate/archimate.module';
import { CanevasModule } from './modules/canevas/canevas.module';
import { UrbanisationModule } from './modules/urbanisation/urbanisation.module';
import { ServiceModule } from './modules/service/service.module';
import { ObjectifModule } from './modules/objectif/objectif.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { BpmnModule } from './modules/bpmn/bpmn.module';
import { DonneesModule } from './modules/donnees/donnees.module';
import { TechnologieModule } from './modules/technologie/technologie.module';
import { RoadmapModule } from './modules/roadmap/roadmap.module';
import { PartiesPrenantesModule } from './modules/parties-prenantes/parties-prenantes.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { OpportunitesModule } from './modules/opportunites/opportunites.module';
import { GouvernanceModule } from './modules/gouvernance/gouvernance.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { VisionCanvasModule } from './modules/vision-canvas/vision-canvas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    // Limite globale par défaut (défense en profondeur) ; /auth/login,
    // /auth/register et /uploads/logo posent une limite plus stricte via
    // @Throttle() vu qu'ils sont publics et sensibles (brute force / DoS disque).
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    OrganisationModule,
    ArchimateModule,
    CanevasModule,
    UrbanisationModule,
    ServiceModule,
    ObjectifModule,
    AdminModule,
    BpmnModule,
    DonneesModule,
    TechnologieModule,
    RoadmapModule,
    PartiesPrenantesModule,
    UploadsModule,
    OpportunitesModule,
    GouvernanceModule,
    EvaluationModule,
    VisionCanvasModule,
    HealthModule,
  ],
  providers: [
    // Ordre important : ThrottlerGuard rejette les requêtes en excès avant
    // tout travail d'auth ; JwtAuthGuard peuple ensuite request.user avant
    // que SuperAdminGuard ne le lise pour bloquer les fuites cross-tenant.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SuperAdminGuard,
    },
  ],
})
export class AppModule {}
