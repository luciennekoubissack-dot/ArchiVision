import { Test, TestingModule } from '@nestjs/testing';
import { TypeElement, TypeRelation } from '@prisma/client';
import { ArchimateService } from './archimate.service';
import { ArchimateViewService } from './archimate-view.service';

describe('ArchimateViewService', () => {
  let service: ArchimateViewService;

  const acteur = { id: 'elem-001', nom: 'Responsable Formation', type: TypeElement.ACTEUR_METIER };
  const processus = { id: 'elem-002', nom: 'Planifier une formation', type: TypeElement.PROCESSUS_METIER };

  const relation = {
    id: 'rel-001',
    type: TypeRelation.ASSIGNATION,
    source: acteur,
    target: processus,
  };

  const archimateServiceMock = {
    findAllElements: jest.fn(),
    findAllRelations: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ArchimateViewService, { provide: ArchimateService, useValue: archimateServiceMock }],
    }).compile();

    service = module.get(ArchimateViewService);
  });

  it('génère un SVG contenant les noms des éléments et les compteurs corrects', async () => {
    archimateServiceMock.findAllElements.mockResolvedValue([acteur, processus]);
    archimateServiceMock.findAllRelations.mockResolvedValue([relation]);

    const result = await service.generate('org-001');

    expect(result.elementCount).toBe(2);
    expect(result.relationCount).toBe(1);
    expect(result.svg).toContain('Responsable Formation');
    expect(result.svg).toContain('Planifier une formation');
    expect(result.svg).toContain('<svg');
  });

  it("applique un style pointillé et un marqueur creux pour une relation de type REALISATION", async () => {
    archimateServiceMock.findAllElements.mockResolvedValue([acteur, processus]);
    archimateServiceMock.findAllRelations.mockResolvedValue([
      { ...relation, type: TypeRelation.REALISATION },
    ]);

    const result = await service.generate('org-001');

    expect(result.svg).toContain('stroke-dasharray');
    expect(result.svg).toContain('url(#hollow-triangle)');
  });

  it('renvoie un SVG « état vide » sans erreur quand il n\'y a aucun élément', async () => {
    archimateServiceMock.findAllElements.mockResolvedValue([]);
    archimateServiceMock.findAllRelations.mockResolvedValue([]);

    const result = await service.generate('org-001');

    expect(result.elementCount).toBe(0);
    expect(result.svg).toContain('Aucun élément ArchiMate');
  });

  it('affiche un élément de la couche Motivation (ex. Vision) avec une couleur distincte de la couche Métier', async () => {
    const vision = { id: 'elem-003', nom: 'Devenir leader régional', type: TypeElement.VISION };
    archimateServiceMock.findAllElements.mockResolvedValue([vision, acteur]);
    archimateServiceMock.findAllRelations.mockResolvedValue([]);

    const result = await service.generate('org-001');

    expect(result.svg).toContain('Devenir leader régional');
    expect(result.svg).toContain('#E6E6FA');
    expect(result.svg).toContain('#FFFFB3');
  });

  it('ignore une relation dont un élément référencé serait absent de la liste (défensif)', async () => {
    archimateServiceMock.findAllElements.mockResolvedValue([acteur]);
    archimateServiceMock.findAllRelations.mockResolvedValue([relation]);

    const result = await service.generate('org-001');

    expect(result.elementCount).toBe(1);
    expect(result.relationCount).toBe(1);
    expect(() => result.svg).not.toThrow();
  });
});
