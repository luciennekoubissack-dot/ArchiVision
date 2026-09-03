import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Paginated } from '../shared/pagination.interface';
import { ApiConfiguration } from '../api-client/api-configuration';
import { InvitationEntity } from '../api-client/models/invitation-entity';
import { CreateInvitationDto } from '../api-client/models/create-invitation-dto';
import { invitationControllerFindAll } from '../api-client/fn/invitations/invitation-controller-find-all';
import { invitationControllerCreate } from '../api-client/fn/invitations/invitation-controller-create';
import { invitationControllerResend } from '../api-client/fn/invitations/invitation-controller-resend';
import { invitationControllerRevoke } from '../api-client/fn/invitations/invitation-controller-revoke';

export type Invitation = InvitationEntity;
export type CreateInvitationPayload = CreateInvitationDto;

/**
 * Enveloppe fine autour du client généré depuis le contrat OpenAPI
 * (`../api-client`), pour garder les mêmes noms de méthode qu'ailleurs.
 */
@Injectable({ providedIn: 'root' })
export class InvitationsService {
  constructor(private http: HttpClient, private config: ApiConfiguration) {}

  listPaginated(page: number, pageSize: number): Observable<Paginated<Invitation>> {
    return invitationControllerFindAll(this.http, this.config.rootUrl, { page, pageSize }).pipe(
      map((r) => r.body as unknown as Paginated<Invitation>),
    );
  }

  create(payload: CreateInvitationPayload): Observable<Invitation> {
    return invitationControllerCreate(this.http, this.config.rootUrl, { body: payload }).pipe(map((r) => r.body));
  }

  resend(id: string): Observable<Invitation> {
    return invitationControllerResend(this.http, this.config.rootUrl, { id }).pipe(map((r) => r.body));
  }

  revoke(id: string): Observable<void> {
    return invitationControllerRevoke(this.http, this.config.rootUrl, { id }).pipe(map(() => undefined));
  }
}
