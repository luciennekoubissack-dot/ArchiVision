import { buildVisionCanvasPrefill } from './vision-canvas.prefill';

describe('buildVisionCanvasPrefill', () => {
  it('mappe vision + objectifs vers businessGoals, problèmes vers needs', () => {
    const payload = buildVisionCanvasPrefill(
      { vision: 'Devenir la référence régionale', problemesResoudre: 'Traitements manuels trop lents', description: null, secteur: null },
      [
        { nom: 'Réduire les délais', description: 'de 30% en un an' },
        { nom: 'Digitaliser le support', description: null },
      ],
      [],
    );

    expect(payload.needs).toBe('Traitements manuels trop lents');
    expect(payload.businessGoals).toBe(
      'Devenir la référence régionale\nRéduire les délais : de 30% en un an\nDigitaliser le support',
    );
  });

  it('mappe les parties prenantes vers targetGroup et détecte les concurrents', () => {
    const payload = buildVisionCanvasPrefill(
      { vision: null, problemesResoudre: null, description: null, secteur: null },
      [],
      [
        { nom: 'Grand public', role: 'client' },
        { nom: 'ACME Corp', role: 'Concurrent direct' },
        { nom: 'Régulateur', role: null },
      ],
    );

    expect(payload.targetGroup).toBe('Grand public (client)\nACME Corp (Concurrent direct)\nRégulateur');
    expect(payload.competitors).toBe('ACME Corp');
  });

  it('utilise la description pour product, sinon le secteur', () => {
    expect(
      buildVisionCanvasPrefill({ description: 'Plateforme SaaS RH', secteur: 'Logiciel' }, [], []).product,
    ).toBe('Plateforme SaaS RH');
    expect(
      buildVisionCanvasPrefill({ description: '  ', secteur: 'Logiciel' }, [], []).product,
    ).toBe('Logiciel');
  });

  it('renvoie un payload vide quand aucune donnée exploitable', () => {
    const payload = buildVisionCanvasPrefill(
      { vision: '', problemesResoudre: null, description: undefined, secteur: '   ' },
      [{ nom: '  ', description: '' }],
      [{ nom: '', role: 'client' }],
    );
    expect(payload).toEqual({});
  });
});
