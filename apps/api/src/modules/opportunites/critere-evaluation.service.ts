import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';
import { CreateCritereEvaluationDto } from './dto/create-critere-evaluation.dto';

@Injectable()
export class CritereEvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  create(organisationId: string, dto: CreateCritereEvaluationDto) {
    return this.prisma.critereEvaluation.create({ data: { ...dto, organisationId } });
  }

  findAll(organisationId: string, pagination?: PaginationQueryDto) {
    return paginateFindMany(this.prisma.critereEvaluation, { where: { organisationId }, orderBy: { nom: 'asc' } }, pagination);
  }

  async remove(id: string, organisationId: string) {
    const count = await this.prisma.critereEvaluation.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Critère ${id} introuvable`);
    return this.prisma.critereEvaluation.delete({ where: { id } });
  }
}
