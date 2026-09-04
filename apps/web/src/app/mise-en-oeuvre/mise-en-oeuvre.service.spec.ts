import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MiseEnOeuvreService } from './mise-en-oeuvre.service';
import { SolutionService } from '../opportunites/solution.service';
import { RoadmapService } from '../roadmap/roadmap.service';

describe('MiseEnOeuvreService', () => {
  let service: MiseEnOeuvreService;
  let solutionServiceMock: jest.Mocked<Pick<SolutionService, 'list' | 'update'>>;
  let roadmapServiceMock: jest.Mocked<Pick<RoadmapService, 'list'>>;

  const now = '2026-09-01T00:00:00.000Z';

  const mockSolutions = [
    {
      id: 's1', nom: 'CRM Cloud', statut: 'RETENUE' as const,
      avancement: 'EN_COURS' as const, commentaireSuivi: 'Déploiement en cours',
      planMiseOeuvre: null, description: null, scores: [], gaps: [],
      organisationId: 'org-1', createdAt: now, updatedAt: now,
    },
    {
      id: 's2', nom: 'ERP Migration', statut: 'RETENUE' as const,
      avancement: 'NON_DEMARRE' as const, commentaireSuivi: null,
      planMiseOeuvre: null, description: null, scores: [], gaps: [],
      organisationId: 'org-1', createdAt: now, updatedAt: now,
    },
    {
      id: 's3', nom: 'Refonte RH', statut: 'RETENUE' as const,
      avancement: 'TERMINE' as const, commentaireSuivi: null,
      planMiseOeuvre: null, description: null, scores: [], gaps: [],
      organisationId: 'org-1', createdAt: now, updatedAt: now,
    },
    // Proposée = ignorée
    {
      id: 's4', nom: 'BI Dashboard', statut: 'PROPOSEE' as const,
      avancement: 'NON_DEMARRE' as const, commentaireSuivi: null,
      planMiseOeuvre: null, description: null, scores: [], gaps: [],
      organisationId: 'org-1', createdAt: now, updatedAt: now,
    },
  ];

  const mockProjets = [
    {
      id: 'p1', nom: 'Projet CRM Cloud', statut: 'EN_COURS' as const, priorite: 'HAUTE' as const,
      description: null, coutEstime: null, dateDebut: null, dateFin: null,
      organisationId: 'org-1', createdAt: now, updatedAt: now,
    },
    {
      id: 'p2', nom: 'Migration Données ERP', statut: 'PLANIFIE' as const, priorite: 'MOYENNE' as const,
      description: null, coutEstime: null, dateDebut: null, dateFin: null,
      organisationId: 'org-1', createdAt: now, updatedAt: now,
    },
    {
      id: 'p3', nom: 'Projet sans lien', statut: 'PLANIFIE' as const, priorite: 'BASSE' as const,
      description: null, coutEstime: null, dateDebut: null, dateFin: null,
      organisationId: 'org-1', createdAt: now, updatedAt: now,
    },
  ];

  beforeEach(() => {
    solutionServiceMock = { list: jest.fn(), update: jest.fn() };
    roadmapServiceMock = { list: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        MiseEnOeuvreService,
        { provide: SolutionService, useValue: solutionServiceMock },
        { provide: RoadmapService, useValue: roadmapServiceMock },
      ],
    });

    service = TestBed.inject(MiseEnOeuvreService);
  });

  it('filtre uniquement les solutions retenues', (done) => {
    solutionServiceMock.list.mockReturnValue(of(mockSolutions as any[]));
    roadmapServiceMock.list.mockReturnValue(of(mockProjets as any[]));

    service.loadSuivi().subscribe(({ suivi }) => {
      expect(suivi).toHaveLength(3);
      expect(suivi.every((s) => s.solution.statut === 'RETENUE')).toBe(true);
      done();
    });
  });

  it('associe les projets dont le nom contient le nom de la solution', (done) => {
    solutionServiceMock.list.mockReturnValue(of(mockSolutions as any[]));
    roadmapServiceMock.list.mockReturnValue(of(mockProjets as any[]));

    service.loadSuivi().subscribe(({ suivi }) => {
      const crm = suivi.find((s) => s.solution.id === 's1')!;
      expect(crm.projetsLies.map((p) => p.id)).toContain('p1');
      expect(crm.projetsLies).toHaveLength(1);
      done();
    });
  });

  it('calcule correctement les KPIs', (done) => {
    solutionServiceMock.list.mockReturnValue(of(mockSolutions as any[]));
    roadmapServiceMock.list.mockReturnValue(of(mockProjets as any[]));

    service.loadSuivi().subscribe(({ stats }) => {
      expect(stats.total).toBe(3);
      expect(stats.enCours).toBe(1);
      expect(stats.nonDemarre).toBe(1);
      expect(stats.termine).toBe(1);
      expect(stats.bloque).toBe(0);
      expect(stats.tauxAvancement).toBe(33); // 1/3 = 33%
      done();
    });
  });

  it('retourne taux=0 si aucune solution retenue', (done) => {
    solutionServiceMock.list.mockReturnValue(of([]));
    roadmapServiceMock.list.mockReturnValue(of([]));

    service.loadSuivi().subscribe(({ stats }) => {
      expect(stats.total).toBe(0);
      expect(stats.tauxAvancement).toBe(0);
      done();
    });
  });

  it('délègue la mise à jour d\'avancement à SolutionService', () => {
    const updated = { ...mockSolutions[0], avancement: 'TERMINE' as const };
    solutionServiceMock.update.mockReturnValue(of(updated as any));

    let result: unknown;
    service.updateAvancement('s1', 'TERMINE', 'Livré').subscribe((r) => (result = r));

    expect(solutionServiceMock.update).toHaveBeenCalledWith('s1', {
      avancement: 'TERMINE',
      commentaireSuivi: 'Livré',
    });
    expect((result as typeof updated).avancement).toBe('TERMINE');
  });
});
