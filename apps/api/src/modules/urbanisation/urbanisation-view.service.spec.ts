import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@archivision/infrastructure';
import { TypeZone } from '@prisma/client';
import { UrbanisationViewService } from './urbanisation-view.service';

describe('UrbanisationViewService', () => {
  let service: UrbanisationViewService;

  const prismaMock = {
    zoneUrbanisation: { findMany: jest.fn() },
    application: { findMany: jest.fn() },
    applicationEchange: { findMany: jest.fn() },
  };

  const application = { id: 'app-001', nom: 'SIRH' };

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

  it('affiche toujours les 5 couches du gabarit POS', async () => {
    prismaMock.zoneUrbanisation.findMany.mockResolvedValue([zone]);

    const result = await service.generate('org-001');

    for (const titre of ['Échange', 'Pilotage &amp; Contrôle', 'Opération', 'Données transverses', 'Ressource &amp; Support']) {
      expect(result.svg).toContain(`>${titre}</text>`);
    }
  });

  it('rattache chaque zone racine à la couche déduite de son nom', async () => {
    const mk = (nom: string) => ({ id: nom, nom, type: TypeZone.ZONE, applications: [], enfants: [] });
    prismaMock.zoneUrbanisation.findMany.mockResolvedValue([
      mk('Zone Échanges partenaires'),
      mk('Zone Décisionnelle'),
      mk('Référentiel Tiers'),
      mk('Support informatique'),
      mk('Ventes'),
    ]);

    const result = await service.generate('org-001');
    const at = (needle: string) => result.svg.indexOf(needle);

    // Chaque zone apparaît après le titre de sa couche et avant le titre de la suivante.
    expect(at('Zone Échanges partenaires')).toBeGreaterThan(at('>Échange</text>'));
    expect(at('Zone Échanges partenaires')).toBeLessThan(at('>Pilotage &amp; Contrôle</text>'));
    expect(at('Zone Décisionnelle')).toBeGreaterThan(at('>Pilotage &amp; Contrôle</text>'));
    expect(at('Référentiel Tiers')).toBeGreaterThan(at('>Données transverses</text>'));
    expect(at('Support informatique')).toBeGreaterThan(at('>Ressource &amp; Support</text>'));
    // « Ventes » n'a aucun mot-clé : il tombe dans Opération, numéroté comme un quartier.
    expect(result.svg).toContain('1. Ventes');
    expect(result.svg).not.toContain('Aucune zone rattachée');
  });

  it("n'affiche que les 4 premières applications d'un îlot et indique le reste", async () => {
    const apps = Array.from({ length: 6 }, (_, i) => ({
      application: { id: `app-${i}`, nom: `App ${i}` },
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

  describe('generateComponents', () => {
    it('génère un SVG avec les applications et leurs services', async () => {
      prismaMock.application.findMany.mockResolvedValue([
        { id: 'app-1', nom: 'SIRH', positionX: null, positionY: null, services: [{ id: 's1', nom: 'Paie' }] },
        { id: 'app-2', nom: 'CRM', positionX: null, positionY: null, services: [] },
      ]);
      prismaMock.applicationEchange.findMany.mockResolvedValue([
        { id: 'e1', sourceId: 'app-1', targetId: 'app-2', description: 'Synchro', protocole: 'REST' },
      ]);

      const result = await service.generateComponents('org-001');

      expect(result.applicationCount).toBe(2);
      expect(result.echangeCount).toBe(1);
      expect(result.svg).toContain('SIRH');
      expect(result.svg).toContain('CRM');
      expect(result.svg).toContain('Paie');
      expect(result.svg).toContain('Aucun service');
      expect(result.svg).toContain('Synchro · REST');
    });

    it('respecte les positions enregistrées quand elles existent', async () => {
      prismaMock.application.findMany.mockResolvedValue([
        { id: 'app-1', nom: 'SIRH', positionX: 250, positionY: 300, services: [] },
      ]);
      prismaMock.applicationEchange.findMany.mockResolvedValue([]);

      const result = await service.generateComponents('org-001');

      expect(result.svg).toContain('x="250"');
      expect(result.svg).toContain('y="300"');
    });

    it('ignore un échange dont une extrémité est absente de la liste des applications', async () => {
      prismaMock.application.findMany.mockResolvedValue([
        { id: 'app-1', nom: 'SIRH', positionX: null, positionY: null, services: [] },
      ]);
      prismaMock.applicationEchange.findMany.mockResolvedValue([
        { id: 'e1', sourceId: 'app-1', targetId: 'app-inconnue', description: null, protocole: null },
      ]);

      const result = await service.generateComponents('org-001');

      expect(result.echangeCount).toBe(0);
    });

    it('renvoie un SVG « état vide » sans erreur quand il n\'y a aucune application', async () => {
      prismaMock.application.findMany.mockResolvedValue([]);
      prismaMock.applicationEchange.findMany.mockResolvedValue([]);

      const result = await service.generateComponents('org-001');

      expect(result.applicationCount).toBe(0);
      expect(result.svg).toContain('Aucune application');
    });
  });
});
