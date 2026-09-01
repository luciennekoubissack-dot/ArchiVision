import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { ArchitectureApplicativeLayoutService } from './architecture-applicative-layout.service';

describe('ArchitectureApplicativeLayoutService', () => {
  let service: ArchitectureApplicativeLayoutService;

  const prismaMock = {
    archiApplicativeElement: { findMany: jest.fn(), update: jest.fn((a) => a) },
    $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArchitectureApplicativeLayoutService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(ArchitectureApplicativeLayoutService);
  });

  it('dispose les éléments en couloirs par type (utilisateur au-dessus des BDD)', async () => {
    prismaMock.archiApplicativeElement.findMany.mockResolvedValue([
      { id: 'u1', type: 'UTILISATEUR_INTERNE' },
      { id: 'a1', type: 'APPLICATION' },
      { id: 'd1', type: 'BASE_DE_DONNEES' },
    ]);

    const result = await service.generateAndPersist('org-1');

    expect(result.count).toBe(3);
    const byId = new Map(result.elements.map((e) => [e.id, e]));
    expect(byId.get('u1')!.positionY).toBeLessThan(byId.get('a1')!.positionY);
    expect(byId.get('a1')!.positionY).toBeLessThan(byId.get('d1')!.positionY);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it('ne persiste rien sans élément', async () => {
    prismaMock.archiApplicativeElement.findMany.mockResolvedValue([]);
    const result = await service.generateAndPersist('org-1');
    expect(result).toEqual({ elements: [], count: 0 });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
