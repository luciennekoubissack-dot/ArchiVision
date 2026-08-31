import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@archivision/infrastructure';
import { Public } from '@archivision/shared';

class HealthCheckResultEntity {
  @ApiProperty({ enum: ['ok', 'error'], description: "État général de l'API." })
  status!: 'ok' | 'error';

  @ApiProperty({ enum: ['ok', 'unreachable'], description: 'État de la connexion à la base de données.' })
  db!: 'ok' | 'unreachable';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Vérifier la disponibilité de l'API et de la base de données (endpoint public)" })
  @ApiOkResponse({ type: HealthCheckResultEntity })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'ok' };
    } catch {
      return { status: 'error', db: 'unreachable' };
    }
  }
}
