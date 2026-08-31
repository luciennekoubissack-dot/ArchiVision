import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiConfiguration } from '../api-client/api-configuration';
import { OrganisationEntity } from '../api-client/models/organisation-entity';
import { OrganisationExportEntity } from '../api-client/models/organisation-export-entity';
import { UpdateOrganisationDto } from '../api-client/models/update-organisation-dto';
import { organisationControllerFindMine } from '../api-client/fn/organisations/organisation-controller-find-mine';
import { organisationControllerUpdateMine } from '../api-client/fn/organisations/organisation-controller-update-mine';
import { organisationControllerExportMine } from '../api-client/fn/organisations/organisation-controller-export-mine';

export type Organisation = OrganisationEntity;
export type UpdateOrganisationPayload = UpdateOrganisationDto;
export type ReferentielExport = OrganisationExportEntity;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class OrganisationService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  getMine(): Observable<Organisation> {
    return organisationControllerFindMine(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }

  updateMine(payload: UpdateOrganisationPayload): Observable<Organisation> {
    return organisationControllerUpdateMine(this.http, this.config.rootUrl, { body: payload }).pipe(
      map((r) => r.body),
    );
  }

  exportReferentiel(): Observable<ReferentielExport> {
    return organisationControllerExportMine(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }
}
