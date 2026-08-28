import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VisionCanvas {
  id: string;
  targetGroup?: string | null;
  needs?: string | null;
  product?: string | null;
  businessGoals?: string | null;
  competitors?: string | null;
  revenueStreams?: string | null;
  costFactors?: string | null;
  channels?: string | null;
}

export type VisionCanvasField = Exclude<keyof VisionCanvas, 'id'>;

export type UpdateVisionCanvasPayload = Partial<Record<VisionCanvasField, string>>;

@Injectable({ providedIn: 'root' })
export class VisionCanvasService {
  constructor(private http: HttpClient) {}

  get(): Observable<VisionCanvas> {
    return this.http.get<VisionCanvas>('/vision-canvas');
  }

  update(payload: UpdateVisionCanvasPayload): Observable<VisionCanvas> {
    return this.http.patch<VisionCanvas>('/vision-canvas', payload);
  }
}
