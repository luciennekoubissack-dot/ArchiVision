import { Test, TestingModule } from '@nestjs/testing';
import { TypeElement } from '@prisma/client';
import { ArchimateService } from './archimate.service';
import { ArchimateLayoutService } from './archimate-layout.service';

describe('ArchimateLayoutService', () => {
  let service: ArchimateLayoutService;

  const acteur = { id: 'elem-001', nom: 'Responsable Formation', type: TypeElement.ACTEUR_METIER };
  const processus = { id: 'elem-002', nom: 'Planifier une formation', type: TypeElement.PROCESSUS_METIER };
  const vision = { id: 'elem-003', nom: 'Devenir leader régional', type: TypeElement.VISION };

  const archimateServiceMock = {
    findAllElements: jest.fn(),
    updateElementPositionsBatch: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ArchimateLayoutService, { provide: ArchimateService, useValue: archimateServiceMock }],
    }).compile();

    service = module.get(ArchimateLayoutService);
  });

  it('calcule une position pour chaque élément et les persiste en un seul lot', async () => {
    archimateServiceMock.findAllElements.mockResolvedValue([acteur, processus, vision]);
    archimateServiceMock.updateElementPositionsBatch.mockImplementation((_orgId, items) =>
      Promise.resolve(items.map((item: { id: string }) => ({ id: item.id }))),
    );

    const result = await service.generateAndPersist('org-001');

    expect(archimateServiceMock.updateElementPositionsBatch).toHaveBeenCalledTimes(1);
    const [organisationId, items] = archimateServiceMock.updateElementPositionsBatch.mock.calls[0];
    expect(organisationId).toBe('org-001');
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(typeof item.positionX).toBe('number');
      expect(typeof item.positionY).toBe('number');
    }
    // La Vision (couche Motivation) doit être placée au-dessus des éléments métier.
    const visionItem = items.find((i: { id: string }) => i.id === vision.id);
    const acteurItem = items.find((i: { id: string }) => i.id === acteur.id);
    expect(visionItem.positionY).toBeLessThan(acteurItem.positionY);
    expect(result.elementCount).toBe(3);
  });

  it("ne fait rien et ne persiste pas si l'organisation n'a aucun élément", async () => {
    archimateServiceMock.findAllElements.mockResolvedValue([]);

    const result = await service.generateAndPersist('org-001');

    expect(result).toEqual({ elements: [], elementCount: 0 });
    expect(archimateServiceMock.updateElementPositionsBatch).not.toHaveBeenCalled();
  });
});
