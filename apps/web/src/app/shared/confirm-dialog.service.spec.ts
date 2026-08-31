import { TestBed } from '@angular/core/testing';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmDialogService);
  });

  it('expose le message en attente via le signal state', () => {
    service.confirm('Supprimer cet élément ?');

    expect(service.state()?.message).toBe('Supprimer cet élément ?');
  });

  it('résout la promesse à true et vide le state quand respond(true) est appelé', async () => {
    const promise = service.confirm('Confirmer ?');

    service.respond(true);

    expect(await promise).toBe(true);
    expect(service.state()).toBeNull();
  });

  it('résout la promesse à false quand respond(false) est appelé', async () => {
    const promise = service.confirm('Confirmer ?');

    service.respond(false);

    expect(await promise).toBe(false);
    expect(service.state()).toBeNull();
  });

  it('ne fait rien si respond est appelé sans confirmation en attente', () => {
    expect(() => service.respond(true)).not.toThrow();
    expect(service.state()).toBeNull();
  });
});
