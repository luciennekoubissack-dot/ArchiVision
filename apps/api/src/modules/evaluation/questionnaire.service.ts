import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@archivision/infrastructure';
import { PaginationQueryDto, paginateFindMany } from '@archivision/shared';
import { Prisma, TypeQuestion } from '@prisma/client';
import { CreateQuestionnaireDto, QuestionDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';

const DETAIL_INCLUDE = { questions: { orderBy: { ordre: 'asc' as const } } };

@Injectable()
export class QuestionnaireService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organisationId: string, pagination?: PaginationQueryDto) {
    return paginateFindMany(
      this.prisma.questionnaire,
      {
        where: { organisationId },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { questions: true } } },
      },
      pagination,
    );
  }

  async findOne(id: string, organisationId: string) {
    const questionnaire = await this.prisma.questionnaire.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!questionnaire || questionnaire.organisationId !== organisationId) {
      throw new NotFoundException(`Questionnaire ${id} introuvable`);
    }
    return questionnaire;
  }

  async create(organisationId: string, dto: CreateQuestionnaireDto) {
    const questions = dto.questions.map((q, i) => this.toQuestionData(q, i));
    return this.prisma.questionnaire.create({
      data: {
        titre: dto.titre,
        description: dto.description,
        organisationId,
        questions: { create: questions },
      },
      include: DETAIL_INCLUDE,
    });
  }

  async update(id: string, organisationId: string, dto: UpdateQuestionnaireDto) {
    await this.assertExists(id, organisationId);

    const data: Prisma.QuestionnaireUpdateInput = {};
    if (dto.titre !== undefined) data.titre = dto.titre;
    if (dto.description !== undefined) data.description = dto.description;

    // `questions` fourni = remplacement intégral : on supprime les anciennes
    // puis on recrée dans le même ordre, en une transaction.
    if (dto.questions) {
      const nouvelles = dto.questions.map((q, i) => this.toQuestionData(q, i));
      return this.prisma.$transaction(async (tx) => {
        await tx.question.deleteMany({ where: { questionnaireId: id } });
        return tx.questionnaire.update({
          where: { id },
          data: { ...data, questions: { create: nouvelles } },
          include: DETAIL_INCLUDE,
        });
      });
    }

    return this.prisma.questionnaire.update({ where: { id }, data, include: DETAIL_INCLUDE });
  }

  async remove(id: string, organisationId: string) {
    await this.assertExists(id, organisationId);
    return this.prisma.questionnaire.delete({ where: { id } });
  }

  async setReponseFichier(id: string, organisationId: string, url: string, nom: string) {
    await this.assertExists(id, organisationId);
    return this.prisma.questionnaire.update({
      where: { id },
      data: { reponseFichierUrl: url, reponseFichierNom: nom },
      include: DETAIL_INCLUDE,
    });
  }

  async removeReponseFichier(id: string, organisationId: string) {
    await this.assertExists(id, organisationId);
    return this.prisma.questionnaire.update({
      where: { id },
      data: { reponseFichierUrl: null, reponseFichierNom: null },
      include: DETAIL_INCLUDE,
    });
  }

  /** Normalise une question selon son type et lui affecte son rang. */
  private toQuestionData(q: QuestionDto, ordre: number) {
    if (q.type === TypeQuestion.CHOIX_MULTIPLE) {
      const options = (q.options ?? []).map((o) => o.trim()).filter((o) => o.length > 0);
      if (options.length < 2) {
        throw new BadRequestException(
          `La question « ${q.intitule} » de type choix multiple doit proposer au moins deux options.`,
        );
      }
      return { intitule: q.intitule, type: q.type, options, noteMax: null, ordre };
    }
    if (q.type === TypeQuestion.NOTE_MAX) {
      return { intitule: q.intitule, type: q.type, options: [], noteMax: q.noteMax ?? 5, ordre };
    }
    return { intitule: q.intitule, type: q.type, options: [], noteMax: null, ordre };
  }

  private async assertExists(id: string, organisationId: string) {
    const count = await this.prisma.questionnaire.count({ where: { id, organisationId } });
    if (!count) throw new NotFoundException(`Questionnaire ${id} introuvable`);
  }
}
