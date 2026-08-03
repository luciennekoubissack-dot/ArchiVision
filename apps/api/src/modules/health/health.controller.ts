import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { Public } from '@archivision/shared';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'ok' };
    } catch {
      return { status: 'error', db: 'unreachable' };
    }
  }
}
