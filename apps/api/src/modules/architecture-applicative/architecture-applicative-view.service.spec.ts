import { Test, TestingModule } from '@nestjs/testing';
import { ArchitectureApplicativeService } from './architecture-applicative.service';
import { ArchitectureApplicativeViewService } from './architecture-applicative-view.service';

describe('ArchitectureApplicativeViewService', () => {
  let service: ArchitectureApplicativeViewService;

  const client = { id: 'elem-001', nom: 'Portail client', type: 'UTILISATEUR_EXTERNE' };
  const app = { id: 'elem-002', nom: 'Application de gestion', type: 'APPLICATION' };
  const db = { id: 'elem-003', nom: 'Base clients', type: 'BASE_DE_DONNEES' };
  const tiers = { id: 'elem-004', nom: 'Service de paiement', type: 'SYSTEME_EXTERNE' };
  const serveur = { id: 'elem-005', nom: 'Serveur applicatif', type: 'INFRASTRUCTURE' };
  const pareFeu = { id: 'elem-006', nom: 'Pare-feu', type: 'SECURITE' };

  const flux1 = { id: 'flux-001', type: 'API', label: 'REST', sourceId: client.id, targetId: app.id };
  const flux2 = { id: 'flux-002', type: 'DONNEES', label: null, sourceId: app.id, targetId: db.id };

  const serviceMock = {
    findAllElements: jest.fn(),
    findAllFlux: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ArchitectureApplicativeViewService, { provide: ArchitectureApplicativeService, useValue: serviceMock }],
    }).compile();

    service = module.get(ArchitectureApplicativeViewService);
  });

  it('génère un SVG contenant tous les éléments et les compteurs corrects', async () => {
    serviceMock.findAllElements.mockResolvedValue([client, app, db, tiers, serveur, pareFeu]);
    serviceMock.findAllFlux.mockResolvedValue([flux1, flux2]);

    const result = await service.generate('org-001');

    expect(result.elementCount).toBe(6);
    expect(result.fluxCount).toBe(2);
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('Portail client');
    expect(result.svg).toContain('Application de');
    expect(result.svg).toContain('gestion');
    expect(result.svg).toContain('Base clients');
    expect(result.svg).toContain('Service de');
    expect(result.svg).toContain('paiement');
    expect(result.svg).toContain('Serveur');
    expect(result.svg).toContain('applicatif');
    expect(result.svg).toContain('Pare-feu');
  });

  it('regroupe les éléments dans des bandes colorées par couche (utilisateurs, applicatif, données, externe, infra)', async () => {
    serviceMock.findAllElements.mockResolvedValue([client, app, db, tiers, serveur]);
    serviceMock.findAllFlux.mockResolvedValue([]);

    const result = await service.generate('org-001');

    expect(result.svg).toContain('Utilisateurs');
    expect(result.svg).toContain('Composants applicatifs');
    expect(result.svg).toContain('Données');
    expect(result.svg).toContain('Systèmes externes');
    expect(result.svg).toContain('Infrastructure');
  });

  it('rend la base de données comme un cylindre distinct des boîtes rectangulaires', async () => {
    serviceMock.findAllElements.mockResolvedValue([db]);
    serviceMock.findAllFlux.mockResolvedValue([]);

    const result = await service.generate('org-001');

    expect(result.svg).toContain('<ellipse');
  });

  it('style le flux API différemment du flux authentification (couleur + pointillés)', async () => {
    const authFlux = { id: 'flux-003', type: 'AUTHENTIFICATION', label: null, sourceId: app.id, targetId: db.id };
    serviceMock.findAllElements.mockResolvedValue([app, db]);
    serviceMock.findAllFlux.mockResolvedValue([authFlux]);

    const result = await service.generate('org-001');

    expect(result.svg).toContain('stroke-dasharray="6,4"');
    expect(result.svg).toContain('#C62828');
  });

  it('affiche une légende avec les libellés de types d\'éléments et de flux', async () => {
    serviceMock.findAllElements.mockResolvedValue([app]);
    serviceMock.findAllFlux.mockResolvedValue([]);

    const result = await service.generate('org-001');

    expect(result.svg).toContain('Composant applicatif');
    expect(result.svg).toContain('API');
    expect(result.svg).toContain('Authentification');
  });

  it('renvoie un SVG « état vide » sans erreur quand il n\'y a aucun élément', async () => {
    serviceMock.findAllElements.mockResolvedValue([]);
    serviceMock.findAllFlux.mockResolvedValue([]);

    const result = await service.generate('org-001');

    expect(result.elementCount).toBe(0);
    expect(result.svg).toContain("Aucun élément d'architecture applicative");
  });

  it('ignore un flux dont un élément référencé serait absent de la liste (défensif)', async () => {
    serviceMock.findAllElements.mockResolvedValue([app]);
    serviceMock.findAllFlux.mockResolvedValue([flux2]);

    const result = await service.generate('org-001');

    expect(result.elementCount).toBe(1);
    expect(result.fluxCount).toBe(0);
    expect(() => result.svg).not.toThrow();
  });
});
