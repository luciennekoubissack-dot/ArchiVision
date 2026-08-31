import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('ajoute un message de succès', () => {
    service.success('Enregistré avec succès');

    expect(service.messages()).toEqual([{ id: 1, type: 'success', text: 'Enregistré avec succès' }]);
  });

  it('ajoute un message d\'erreur', () => {
    service.error('Une erreur est survenue');

    expect(service.messages()).toEqual([{ id: 1, type: 'error', text: 'Une erreur est survenue' }]);
  });

  it('ajoute un message d\'information', () => {
    service.info('Information utile');

    expect(service.messages()).toEqual([{ id: 1, type: 'info', text: 'Information utile' }]);
  });

  it('empile plusieurs messages avec des identifiants croissants', () => {
    service.success('Premier');
    service.error('Second');

    expect(service.messages()).toEqual([
      { id: 1, type: 'success', text: 'Premier' },
      { id: 2, type: 'error', text: 'Second' },
    ]);
  });

  it('retire un message via dismiss', () => {
    service.success('À retirer');
    const id = service.messages()[0].id;

    service.dismiss(id);

    expect(service.messages()).toEqual([]);
  });

  it('retire automatiquement le message après 4 secondes', fakeAsync(() => {
    service.success('Message temporaire');
    expect(service.messages().length).toBe(1);

    tick(4000);

    expect(service.messages()).toEqual([]);
  }));
});
