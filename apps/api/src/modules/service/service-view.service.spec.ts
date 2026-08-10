import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { RoleUtilisateur } from '@prisma/client';
import { ServiceViewService } from './service-view.service';

describe('ServiceViewService', () => {
  let service: ServiceViewService;

  const prismaMock = {
    service: { findMany: jest.fn() },
  };

  const membre = { id: 'user-001', nom: 'Admin ArchiVision', role: RoleUtilisateur.ADMINISTRATEUR };

  const serviceRacine = {
    id: 'service-001',
    nom: 'Direction Générale',
    membres: [membre],
    enfants: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceViewService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(ServiceViewService);
  });

  it("génère un SVG contenant la hiérarchie des services et leurs membres", async () => {
    prismaMock.service.findMany.mockResolvedValue([serviceRacine]);

    const result = await service.generate('org-001');

    expect(result.serviceCount).toBe(1);
    expect(result.membreCount).toBe(1);
    expect(result.svg).toContain('Direction Générale');
    expect(result.svg).toContain('Admin ArchiVision');
  });

  it('compte les services et membres sur plusieurs niveaux', async () => {
    const enfant = { id: 'service-002', nom: 'Service Support', membres: [], enfants: [] };
    prismaMock.service.findMany.mockResolvedValue([{ ...serviceRacine, enfants: [enfant] }]);

    const result = await service.generate('org-001');

    expect(result.serviceCount).toBe(2);
    expect(result.svg).toContain('Service Support');
  });

  it('renvoie un SVG « état vide » sans erreur quand il n\'y a aucun service', async () => {
    prismaMock.service.findMany.mockResolvedValue([]);

    const result = await service.generate('org-001');

    expect(result.serviceCount).toBe(0);
    expect(result.membreCount).toBe(0);
    expect(result.svg).toContain('Aucun service défini');
  });

  it('filtre les services racines via parentId: null dans la requête Prisma', async () => {
    prismaMock.service.findMany.mockResolvedValue([serviceRacine]);

    await service.generate('org-001');

    expect(prismaMock.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organisationId: 'org-001', parentId: null } }),
    );
  });
});
