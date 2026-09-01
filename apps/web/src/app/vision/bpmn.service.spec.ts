import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  BpmnService,
  BpmnProcessus,
  BpmnProcessusDetail,
  BpmnElement,
  BpmnFlow,
} from './bpmn.service';

describe('BpmnService', () => {
  let service: BpmnService;
  let httpMock: HttpTestingController;

  const mockProcessus: BpmnProcessus = {
    id: 'processus-001',
    nom: 'Traitement des réclamations',
    type: 'METIER',
    description: null,
    bpmnXml: null,
    createdAt: '2026-07-01T10:00:00.000Z',
    updatedAt: '2026-07-01T10:00:00.000Z',
  };

  const mockElement: BpmnElement = {
    id: 'element-001',
    nom: 'Recevoir la réclamation',
    type: 'EVENEMENT_DEBUT',
    statut: 'AS_IS',
    processusId: mockProcessus.id,
    declencheur: 'MESSAGE',
  };

  const mockFlow: BpmnFlow = {
    id: 'flow-001',
    sourceId: 'element-001',
    targetId: 'element-002',
    label: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BpmnService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('liste tous les processus BPMN', () => {
    let result: unknown;
    service.list().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/bpmn-processus');
    expect(req.request.method).toBe('GET');
    req.flush([{ ...mockProcessus, _count: { elements: 2 } }]);

    expect(result).toEqual([{ ...mockProcessus, _count: { elements: 2 } }]);
  });

  it('récupère le détail d\'un processus BPMN', () => {
    let result: unknown;
    const mockDetail: BpmnProcessusDetail = { ...mockProcessus, elements: [mockElement] };
    service.get(mockProcessus.id).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/bpmn-processus/${mockProcessus.id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDetail);

    expect(result).toEqual(mockDetail);
  });

  it('génère la vue BPMN', () => {
    let result: unknown;
    service.generateView(mockProcessus.id).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/bpmn-processus/${mockProcessus.id}/generate-vue`);
    expect(req.request.method).toBe('GET');
    req.flush({ elementCount: 3, flowCount: 2, svg: '<svg></svg>' });

    expect(result).toEqual({ elementCount: 3, flowCount: 2, svg: '<svg></svg>' });
  });

  it('génère une proposition de diagramme depuis les étapes', () => {
    let result: unknown;
    const mockDetail: BpmnProcessusDetail = { ...mockProcessus, elements: [mockElement] };
    service.generateDiagramme(mockProcessus.id).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/bpmn-processus/${mockProcessus.id}/generer-diagramme`);
    expect(req.request.method).toBe('POST');
    req.flush(mockDetail);

    expect(result).toEqual(mockDetail);
  });

  it('crée un processus BPMN', () => {
    let result: unknown;
    service.create({ nom: mockProcessus.nom }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/bpmn-processus');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockProcessus.nom });
    req.flush(mockProcessus);

    expect(result).toEqual(mockProcessus);
  });

  it('met à jour un processus BPMN', () => {
    let result: unknown;
    service.update(mockProcessus.id, { nom: 'Nouveau nom' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/bpmn-processus/${mockProcessus.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockProcessus, nom: 'Nouveau nom' });

    expect((result as BpmnProcessus).nom).toBe('Nouveau nom');
  });

  it('supprime un processus BPMN', () => {
    let completed = false;
    service.delete(mockProcessus.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/bpmn-processus/${mockProcessus.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('ajoute un élément à un processus', () => {
    let result: unknown;
    service.addElement(mockProcessus.id, { nom: mockElement.nom, type: mockElement.type }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/bpmn-processus/${mockProcessus.id}/elements`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nom: mockElement.nom, type: mockElement.type });
    req.flush(mockElement);

    expect(result).toEqual(mockElement);
  });

  it('met à jour un élément BPMN', () => {
    let result: unknown;
    service.updateElement(mockElement.id, { nom: 'Nouveau nom' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/bpmn-processus/elements/${mockElement.id}`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockElement, nom: 'Nouveau nom' });

    expect((result as BpmnElement).nom).toBe('Nouveau nom');
  });

  it('supprime un élément BPMN', () => {
    let completed = false;
    service.deleteElement(mockElement.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/bpmn-processus/elements/${mockElement.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });

  it('ajoute un flux à un processus', () => {
    let result: unknown;
    service.addFlow(mockProcessus.id, { sourceId: mockFlow.sourceId, targetId: mockFlow.targetId }).subscribe((r) => (result = r));

    const req = httpMock.expectOne(`/api/v1/bpmn-processus/${mockProcessus.id}/flows`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ sourceId: mockFlow.sourceId, targetId: mockFlow.targetId });
    req.flush(mockFlow);

    expect(result).toEqual(mockFlow);
  });

  it('supprime un flux BPMN', () => {
    let completed = false;
    service.deleteFlow(mockFlow.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`/api/v1/bpmn-processus/flows/${mockFlow.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
  });
});
