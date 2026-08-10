import { Module } from '@nestjs/common';
import { CanevasController } from './canevas.controller';
import { CanevasService } from './canevas.service';

@Module({
  controllers: [CanevasController],
  providers: [CanevasService],
})
export class CanevasModule {}
