import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { QuestionnaireService } from './questionnaire.service';

describe('QuestionnaireService', () => {
  let service: QuestionnaireService;
  const ORG_ID = 'org-001';
  const AUTRE_ORG_ID = 'org-002';

  const mockQuestionnaire = {
    id: 'q-001',
    titre: 'Satisfaction architecture',
    description: null,
    reponseFichierUrl: null,
    reponseFichierNom: null,
    organisationId: ORG_ID,
    createdAt: new Date('2026-07-01T10:00:00.000Z'),
    updatedAt: new Date('2026-07-01T10:00:00.000Z'),
  };

  const prismaMock = {
    questionnaire: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    question: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  prismaMock.$transaction.mockImplementation((cb: (tx: typeof prismaMock) => unknown) => cb(prismaMock));

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionnaireService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(QuestionnaireService);
  });

  it('crée un questionnaire avec ses questions normalisées et ordonnées', async () => {
    prismaMock.questionnaire.create.mockResolvedValue({ ...mockQuestionnaire, questions: [] });

    await service.create(ORG_ID, {
      titre: mockQuestionnaire.titre,
      questions: [
        { intitule: 'Recommanderiez-vous ?', type: 'OUI_NON' as never },
        { intitule: 'Quelle note ?', type: 'NOTE_MAX' as never, noteMax: 10 },
        { intitule: 'Meilleur canal ?', type: 'CHOIX_MULTIPLE' as never, options: ['Mail', 'Réunion'] },
      ],
    });

    const data = prismaMock.questionnaire.create.mock.calls[0][0].data;
    expect(data.questions.create).toEqual([
      { intitule: 'Recommanderiez-vous ?', type: 'OUI_NON', options: [], noteMax: null, ordre: 0 },
      { intitule: 'Quelle note ?', type: 'NOTE_MAX', options: [], noteMax: 10, ordre: 1 },
      { intitule: 'Meilleur canal ?', type: 'CHOIX_MULTIPLE', options: ['Mail', 'Réunion'], noteMax: null, ordre: 2 },
    ]);
  });

  it('refuse une question choix multiple avec moins de deux options', async () => {
    await expect(
      service.create(ORG_ID, {
        titre: 'x',
        questions: [{ intitule: 'Canal ?', type: 'CHOIX_MULTIPLE' as never, options: ['Mail'] }],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('applique une note par défaut (5) à une question NOTE_MAX sans borne', async () => {
    prismaMock.questionnaire.create.mockResolvedValue({ ...mockQuestionnaire, questions: [] });
    await service.create(ORG_ID, {
      titre: 'x',
      questions: [{ intitule: 'Note ?', type: 'NOTE_MAX' as never }],
    });
    const data = prismaMock.questionnaire.create.mock.calls[0][0].data;
    expect(data.questions.create[0].noteMax).toBe(5);
  });

  it('remplace intégralement les questions à la mise à jour', async () => {
    prismaMock.questionnaire.count.mockResolvedValue(1);
    prismaMock.questionnaire.update.mockResolvedValue({ ...mockQuestionnaire, questions: [] });

    await service.update('q-001', ORG_ID, {
      questions: [{ intitule: 'Nouvelle', type: 'REPONSE_OUVERTE' as never }],
    });

    expect(prismaMock.question.deleteMany).toHaveBeenCalledWith({ where: { questionnaireId: 'q-001' } });
    expect(prismaMock.questionnaire.update).toHaveBeenCalled();
  });

  it('ne touche pas aux questions si `questions` est absent de la mise à jour', async () => {
    prismaMock.questionnaire.count.mockResolvedValue(1);
    prismaMock.questionnaire.update.mockResolvedValue({ ...mockQuestionnaire, questions: [] });

    await service.update('q-001', ORG_ID, { titre: 'Nouveau titre' });

    expect(prismaMock.question.deleteMany).not.toHaveBeenCalled();
  });

  it('lève NotFoundException pour un questionnaire d\'une autre organisation', async () => {
    prismaMock.questionnaire.findUnique.mockResolvedValue(mockQuestionnaire);
    await expect(service.findOne('q-001', AUTRE_ORG_ID)).rejects.toThrow(NotFoundException);
  });

  it('enregistre puis détache le fichier de réponses', async () => {
    prismaMock.questionnaire.count.mockResolvedValue(1);
    prismaMock.questionnaire.update.mockResolvedValue({ ...mockQuestionnaire, questions: [] });

    await service.setReponseFichier('q-001', ORG_ID, '/uploads/abc.pdf', 'reponses.pdf');
    expect(prismaMock.questionnaire.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { reponseFichierUrl: '/uploads/abc.pdf', reponseFichierNom: 'reponses.pdf' } }),
    );

    await service.removeReponseFichier('q-001', ORG_ID);
    expect(prismaMock.questionnaire.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { reponseFichierUrl: null, reponseFichierNom: null } }),
    );
  });
});
