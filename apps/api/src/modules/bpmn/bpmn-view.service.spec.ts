import { Test, TestingModule } from '@nestjs/testing';
import { DeclencheurEvenement, TypeBpmn, TypeTache } from '@prisma/client';
import { BpmnService } from './bpmn.service';
import { BpmnViewService } from './bpmn-view.service';

describe('BpmnViewService', () => {
  let service: BpmnViewService;

  const debut = { id: 'el-001', nom: 'Début', type: TypeBpmn.EVENEMENT_DEBUT, positionX: null, positionY: null, flowsSource: [] as any[] };
  const tache = { id: 'el-002', nom: 'Traiter la demande', type: TypeBpmn.TACHE, positionX: null, positionY: null, flowsSource: [] as any[] };
  const fin = { id: 'el-003', nom: 'Fin', type: TypeBpmn.EVENEMENT_FIN, positionX: null, positionY: null, flowsSource: [] as any[] };

  const flow1 = { id: 'flow-001', label: 'Validé', sourceId: debut.id, targetId: tache.id };
  const flow2 = { id: 'flow-002', label: null, sourceId: tache.id, targetId: fin.id };

  const bpmnServiceMock = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [BpmnViewService, { provide: BpmnService, useValue: bpmnServiceMock }],
    }).compile();

    service = module.get(BpmnViewService);
  });

  it('génère un SVG contenant les étapes et les compteurs corrects', async () => {
    bpmnServiceMock.findOne.mockResolvedValue({
      id: 'processus-001',
      elements: [
        { ...debut, flowsSource: [flow1] },
        { ...tache, flowsSource: [flow2] },
        { ...fin, flowsSource: [] },
      ],
    });

    const result = await service.generate('processus-001', 'org-001');

    expect(result.elementCount).toBe(3);
    expect(result.flowCount).toBe(2);
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('Traiter la');
    expect(result.svg).toContain('demande');
    expect(result.svg).toContain('Validé');
  });

  it('renvoie un SVG « état vide » sans erreur quand le processus n\'a aucune étape', async () => {
    bpmnServiceMock.findOne.mockResolvedValue({ id: 'processus-002', elements: [] });

    const result = await service.generate('processus-002', 'org-001');

    expect(result.elementCount).toBe(0);
    expect(result.svg).toContain('Aucune étape');
  });

  it('utilise la position enregistrée quand elle existe, sinon un positionnement en cascade', async () => {
    bpmnServiceMock.findOne.mockResolvedValue({
      id: 'processus-003',
      elements: [{ ...tache, positionX: 500, positionY: 300, flowsSource: [] }],
    });

    const result = await service.generate('processus-003', 'org-001');

    expect(result.svg).toContain('x="500"');
    expect(result.svg).toContain('y="300"');
  });

  it('replie sur une nouvelle ligne un processus avec beaucoup d\'étapes non positionnées', async () => {
    const manyTasks = Array.from({ length: 12 }, (_, i) => ({
      ...tache,
      id: `el-tache-${i}`,
      nom: `Étape ${i}`,
      flowsSource: [],
    }));
    bpmnServiceMock.findOne.mockResolvedValue({ id: 'processus-004', elements: manyTasks });

    const result = await service.generate('processus-004', 'org-001');

    expect(result.elementCount).toBe(12);
    // Avec des tâches de 150px + 40 de marge, la 6e étape dépasse la largeur
    // max de 1000px et doit passer à la ligne suivante (y = 60 + 140 = 200).
    expect(result.svg).toContain('y="200"');
  });

  it('distingue visuellement chaque déclencheur d\'événement par une icône propre', async () => {
    const declencheurs: DeclencheurEvenement[] = ['MESSAGE', 'MINUTERIE', 'ERREUR', 'SIGNAL', 'CONDITIONNEL', 'ESCALADE', 'TERMINAISON'];
    const elements = declencheurs.map((declencheur, i) => ({
      id: `el-evt-${i}`,
      nom: `Événement ${declencheur}`,
      type: TypeBpmn.EVENEMENT_INTERMEDIAIRE,
      declencheur,
      positionX: null,
      positionY: null,
      flowsSource: [],
    }));
    bpmnServiceMock.findOne.mockResolvedValue({ id: 'processus-005', elements });

    const result = await service.generate('processus-005', 'org-001');

    expect(result.elementCount).toBe(7);
    // TERMINAISON (7e élément du cascade, x=40+6*88=568, cx=592) se distingue
    // par un disque plein (fill = couleur pleine) plutôt qu'un simple contour.
    expect(result.svg).toContain('<circle cx="592" cy="84" r="6" fill="#E29E09" />');
  });

  it('un événement sans déclencheur reste un cercle générique (« none »), sans glyphe interne', async () => {
    bpmnServiceMock.findOne.mockResolvedValue({
      id: 'processus-005b',
      elements: [{ ...debut, declencheur: null, flowsSource: [] }],
    });

    const result = await service.generate('processus-005b', 'org-001');

    // EVENEMENT_DEBUT ne dessine qu'un seul cercle (bordure) quand aucun
    // déclencheur n'est fourni — aucun glyphe interne ajouté.
    expect((result.svg.match(/<circle/g) || []).length).toBe(1);
  });

  it('rend chaque nature de tâche avec une icône différente et affiche les nouvelles passerelles et le sous-processus', async () => {
    const taches: TypeTache[] = ['UTILISATEUR', 'SERVICE', 'MANUELLE', 'ENVOI', 'RECEPTION', 'REGLE_METIER', 'SCRIPT'];
    const elements = [
      ...taches.map((typeTache, i) => ({
        id: `el-tache-${i}`,
        nom: `Tâche ${typeTache}`,
        type: TypeBpmn.TACHE,
        typeTache,
        positionX: null,
        positionY: null,
        flowsSource: [],
      })),
      { id: 'el-incl', nom: 'Choix multiple', type: TypeBpmn.PASSERELLE_INCLUSIVE, positionX: null, positionY: null, flowsSource: [] },
      { id: 'el-evgw', nom: 'Attente événement', type: TypeBpmn.PASSERELLE_EVENEMENTIELLE, positionX: null, positionY: null, flowsSource: [] },
      { id: 'el-sub', nom: 'Sous-processus X', type: TypeBpmn.SOUS_PROCESSUS, positionX: null, positionY: null, flowsSource: [] },
    ];
    bpmnServiceMock.findOne.mockResolvedValue({ id: 'processus-006', elements });

    const result = await service.generate('processus-006', 'org-001');

    expect(result.elementCount).toBe(10);
    expect(result.svg).toContain('Choix multiple');
    expect(result.svg).toContain('Attente événement');
    expect(result.svg).toContain('Sous-processus');
    // Le sous-processus a un remplissage blanc (contrairement à la tâche, foncée) et un marqueur "+".
    expect(result.svg).toContain('fill="#ffffff" stroke="#1E283D"');
  });
});
