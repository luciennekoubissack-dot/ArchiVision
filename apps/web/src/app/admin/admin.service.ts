import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../shared/pagination.interface';
import { ApiConfiguration } from '../api-client/api-configuration';
import { AdminOrganisationListItemEntity } from '../api-client/models/admin-organisation-list-item-entity';
import { AdminOrganisationEntity } from '../api-client/models/admin-organisation-entity';
import { AdminUtilisateurEntity } from '../api-client/models/admin-utilisateur-entity';
import { AdminStatsEntity } from '../api-client/models/admin-stats-entity';
import { SimulatedEmailEntity } from '../api-client/models/simulated-email-entity';
import { AdminOrganisationActionResultEntity } from '../api-client/models/admin-organisation-action-result-entity';
import { adminControllerListOrganisations } from '../api-client/fn/admin/admin-controller-list-organisations';
import { adminControllerGetOrganisation } from '../api-client/fn/admin/admin-controller-get-organisation';
import { adminControllerValider } from '../api-client/fn/admin/admin-controller-valider';
import { adminControllerRejeter } from '../api-client/fn/admin/admin-controller-rejeter';
import { adminControllerRemove } from '../api-client/fn/admin/admin-controller-remove';
import { adminControllerListUtilisateurs } from '../api-client/fn/admin/admin-controller-list-utilisateurs';
import { adminControllerStats } from '../api-client/fn/admin/admin-controller-stats';

export type StatutOrganisation = 'EN_ATTENTE' | 'VALIDEE' | 'REJETEE';

export type OrganisationAdmin = AdminOrganisationListItemEntity;

export type UtilisateurAdmin = AdminUtilisateurEntity;

/**
 * Le détail renvoyé par `GET /admin/organisations/:id` (`AdminOrganisationEntity`)
 * n'expose pas `_count`, contrairement à l'élément de liste : aucun composant n'y
 * accède sur le détail, donc l'alias direct sur le type généré est sans risque.
 */
export type OrganisationDetailAdmin = AdminOrganisationEntity;

export type SimulatedEmail = SimulatedEmailEntity;

export type StatsAdmin = AdminStatsEntity;

/**
 * Depuis la correction du 2026-08-31 (l'update Prisma de valider/rejeter
 * inclut désormais `_count`), la forme générée correspond exactement à la
 * forme historique : simple alias, plus besoin de caster à la frontière.
 */
export type OrganisationActionResult = AdminOrganisationActionResultEntity;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'avant partout
 * ailleurs dans l'app.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  listOrganisations(
    statut: StatutOrganisation | undefined,
    page: number,
    pageSize: number,
  ): Observable<Paginated<OrganisationAdmin>> {
    return adminControllerListOrganisations(this.http, this.config.rootUrl, { statut, page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<OrganisationAdmin>),
    );
  }

  getOrganisation(id: string): Observable<OrganisationDetailAdmin> {
    return adminControllerGetOrganisation(this.http, this.config.rootUrl, { id }).pipe(map((r) => r.body));
  }

  valider(id: string): Observable<OrganisationActionResult> {
    return adminControllerValider(this.http, this.config.rootUrl, { id }).pipe(map((r) => r.body));
  }

  rejeter(id: string): Observable<OrganisationActionResult> {
    return adminControllerRejeter(this.http, this.config.rootUrl, { id }).pipe(map((r) => r.body));
  }

  remove(id: string): Observable<void> {
    return adminControllerRemove(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }

  listUtilisateurs(page: number, pageSize: number): Observable<Paginated<UtilisateurAdmin>> {
    return adminControllerListUtilisateurs(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<UtilisateurAdmin>),
    );
  }

  stats(): Observable<StatsAdmin> {
    return adminControllerStats(this.http, this.config.rootUrl).pipe(map((r) => r.body));
  }
}
