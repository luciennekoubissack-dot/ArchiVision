import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { Criticite, TypeZone } from '@prisma/client';
import { UrbanisationViewService } from './urbanisation-view.service';

describe('UrbanisationViewService', () => {
  let service: UrbanisationViewService;

  const prismaMock = {
    zoneUrbanisation: { findMany: jest.fn() },
  };

  const application = { id: 'app-001', nom: 'SIRH', criticite: Criticite.HAUTE };

  const ilot = {
    id: 'zone-002',
    nom: 'Îlot Formation',
    type: TypeZone.ILOT,
    applications: [{ application }],
  };

  const zone = {
    id: 'zone-001',
    nom: 'Zone RH',
    type: TypeZone.ZONE,
    applications: [],
    enfants: [{ ...ilot, enfants: [] }],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UrbanisationViewService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get(UrbanisationViewService);
  });

  it('génère un SVG contenant la hiérarchie des zones et les applications affectées', async () => {
    prismaMock.zoneUrbanisation.findMany.mockResolvedValue([zone]);

    const result = await service.generate('org-001');

    expect(result.zoneCount).toBe(2);
    expect(result.applicationCount).toBe(1);
    expect(result.svg).toContain('Zone RH');
    expect(result.svg).toContain('Îlot Formation');
    expect(result.svg).toContain('SIRH');
  });

  it('colore une application HAUTE criticité différemment de BASSE', async () => {
    const appBasse = { id: 'app-002', nom: 'Site vitrine', criticite: Criticite.BASSE };
    const ilotAvecDeux = {
      ...ilot,
      applications: [{ application }, { application: appBasse }],
      enfants: [],
    };
    prismaMock.zoneUrbanisation.findMany.mockResolvedValue([{ ...zone, enfants: [ilotAvecDeux] }]);

    const result = await service.generate('org-001');

    expect(result.svg).toContain('#F28B82'); // HAUTE
    expect(result.svg).toContain('#A5D6A7'); // BASSE
  });

  it("n'affiche que les 4 premières applications d'un îlot et indique le reste", async () => {
    const apps = Array.from({ length: 6 }, (_, i) => ({
      application: { id: `app-${i}`, nom: `App ${i}`, criticite: Criticite.MOYENNE },
    }));
    const ilotCharge = { ...ilot, applications: apps, enfants: [] };
    prismaMock.zoneUrbanisation.findMany.mockResolvedValue([{ ...zone, enfants: [ilotCharge] }]);

    const result = await service.generate('org-001');

    expect(result.svg).toContain('App 0');
    expect(result.svg).toContain('+2 autres');
  });

  it('renvoie un SVG « état vide » sans erreur quand il n\'y a aucune zone', async () => {
    prismaMock.zoneUrbanisation.findMany.mockResolvedValue([]);

    const result = await service.generate('org-001');

    expect(result.zoneCount).toBe(0);
    expect(result.applicationCount).toBe(0);
    expect(result.svg).toContain("Aucune zone d'urbanisation");
  });

  it('filtre les zones racines via parentId: null dans la requête Prisma', async () => {
    prismaMock.zoneUrbanisation.findMany.mockResolvedValue([zone]);

    await service.generate('org-001');

    expect(prismaMock.zoneUrbanisation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organisationId: 'org-001', parentId: null },
      }),
    );
  });
});
