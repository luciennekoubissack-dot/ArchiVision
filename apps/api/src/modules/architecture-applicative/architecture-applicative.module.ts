import { Module } from '@nestjs/common';
import { ArchitectureApplicativeController } from './architecture-applicative.controller';
import { ArchitectureApplicativeService } from './architecture-applicative.service';
import { ArchitectureApplicativeViewService } from './architecture-applicative-view.service';

@Module({
  controllers: [ArchitectureApplicativeController],
  providers: [ArchitectureApplicativeService, ArchitectureApplicativeViewService],
})
export class ArchitectureApplicativeModule {}
