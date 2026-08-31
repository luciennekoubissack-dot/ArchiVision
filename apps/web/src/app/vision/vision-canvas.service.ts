import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiConfiguration } from '../api-client/api-configuration';
import { UpdateVisionCanvasDto } from '../api-client/models/update-vision-canvas-dto';
import { visionCanvasControllerGet } from '../api-client/fn/vision-canvas/vision-canvas-controller-get';
import { visionCanvasControllerUpdate } from '../api-client/fn/vision-canvas/vision-canvas-controller-update';

/**
 * `VisionCanvasEntity` (généré) exige aussi `organisationId` et `updatedAt` en
 * champs obligatoires, ce qui casse l'initialisation `{ id: '' }` faite dans
 * `vision.component.ts`. On garde donc cette interface écrite à la main
 * (compatible structurellement avec `VisionCanvasEntity` en lecture).
 */
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

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class VisionCanvasService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  get(): Observable<VisionCanvas> {
    return visionCanvasControllerGet(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  update(payload: UpdateVisionCanvasPayload): Observable<VisionCanvas> {
    return visionCanvasControllerUpdate(this.http, this.config.rootUrl, { body: payload as UpdateVisionCanvasDto }).pipe(
      map((r) => r.body),
    );
  }
}
