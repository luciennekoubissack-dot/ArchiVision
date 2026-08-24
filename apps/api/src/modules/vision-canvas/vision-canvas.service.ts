import { Injectable } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { UpdateVisionCanvasDto } from './dto/update-vision-canvas.dto';

@Injectable()
export class VisionCanvasService {
  constructor(private readonly prisma: PrismaService) {}

  get(organisationId: string) {
    return this.prisma.visionCanvas.upsert({
      where: { organisationId },
      create: { organisationId },
      update: {},
    });
  }

  update(organisationId: string, dto: UpdateVisionCanvasDto) {
    return this.prisma.visionCanvas.upsert({
      where: { organisationId },
      create: { organisationId, ...dto },
      update: dto,
    });
  }
}
