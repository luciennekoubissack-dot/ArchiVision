import { Module } from '@nestjs/common';
import { ArchitectureApplicativeController } from './architecture-applicative.controller';
import { ArchitectureApplicativeService } from './architecture-applicative.service';
import { ArchitectureApplicativeViewService } from './architecture-applicative-view.service';
import { ArchitectureApplicativeLayoutService } from './architecture-applicative-layout.service';

@Module({
  controllers: [ArchitectureApplicativeController],
  providers: [
    ArchitectureApplicativeService,
    ArchitectureApplicativeViewService,
    ArchitectureApplicativeLayoutService,
  ],
})
export class ArchitectureApplicativeModule {}
