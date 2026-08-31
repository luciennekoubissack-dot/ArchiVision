import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VisionCanvasService, VisionCanvas } from './vision-canvas.service';

describe('VisionCanvasService', () => {
  let service: VisionCanvasService;
  let httpMock: HttpTestingController;

  const mockCanvas: VisionCanvas = {
    id: 'canvas-001',
    targetGroup: 'PME industrielles',
    needs: null,
    product: null,
    businessGoals: null,
    competitors: null,
    revenueStreams: null,
    costFactors: null,
    channels: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VisionCanvasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('récupère le vision canvas', () => {
    let result: unknown;
    service.get().subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/vision-canvas');
    expect(req.request.method).toBe('GET');
    req.flush(mockCanvas);

    expect(result).toEqual(mockCanvas);
  });

  it('met à jour le vision canvas', () => {
    let result: unknown;
    service.update({ targetGroup: 'Grands comptes' }).subscribe((r) => (result = r));

    const req = httpMock.expectOne('/api/v1/vision-canvas');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ targetGroup: 'Grands comptes' });
    req.flush({ ...mockCanvas, targetGroup: 'Grands comptes' });

    expect((result as VisionCanvas).targetGroup).toBe('Grands comptes');
  });
});
