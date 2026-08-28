import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';
import { CreateSolutionDto } from './dto/create-solution.dto';
import { UpdateSolutionDto } from './dto/update-solution.dto';
import { ScoreItemDto } from './dto/update-scores.dto';

@Injectable()
export class SolutionService {
  constructor(private readonly prisma: PrismaService) {}

  create(organisationId: string, dto: CreateSolutionDto) {
    return this.prisma.solution.create({ data: { ...dto, organisationId }, include: { scores: true } });
  }

  findAll(organisationId: string, pagination?: PaginationQueryDto) {
    return paginateFindMany(
      this.prisma.solution,
      { where: { organisationId }, orderBy: { nom: 'asc' }, include: { scores: true } },
      pagination,
    );
  }

  async findOne(id: string, organisationId: string) {
    const solution = await this.prisma.solution.findUnique({
      where: { id },
      include: { scores: { include: { critere: true } } },
    });
    if (!solution || solution.organisationId !== organisationId) {
      throw new NotFoundException(`Solution ${id} introuvable`);
    }
    return solution;
  }

  async update(id: string, organisationId: string, dto: UpdateSolutionDto) {
    await this.assertExists(id, organisationId);
    return this.prisma.solution.update({ where: { id }, data: dto, include: { scores: true } });
  }

  async remove(id: string, organisationId: string) {
    await this.assertExists(id, organisationId);
    return this.prisma.solution.delete({ where: { id } });
  }

  async updateScores(id: string, organisationId: string, items: ScoreItemDto[]) {
    await this.assertExists(id, organisationId);

    const critereIds = items.map((item) => item.critereId);
    const count = await this.prisma.critereEvaluation.count({
      where: { id: { in: critereIds }, organisationId },
    });
    if (count !== new Set(critereIds).size) {
      throw new NotFoundException('Un ou plusieurs critères introuvables');
    }

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.evaluationScore.upsert({
          where: { solutionId_critereId: { solutionId: id, critereId: item.critereId } },
          create: { solutionId: id, critereId: item.critereId, score: item.score, commentaire: item.commentaire },
          update: { score: item.score, commentaire: item.commentaire },
        }),
      ),
    );

    return this.findOne(id, organisationId);
  }

  private async assertExists(id: string, organisationId: string) {
    const count = await this.prisma.solution.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Solution ${id} introuvable`);
  }
}
