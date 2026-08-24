import { Module } from '@nestjs/common';
import { VisionCanvasController } from './vision-canvas.controller';
import { VisionCanvasService } from './vision-canvas.service';

@Module({
  controllers: [VisionCanvasController],
  providers: [VisionCanvasService],
})
export class VisionCanvasModule {}
