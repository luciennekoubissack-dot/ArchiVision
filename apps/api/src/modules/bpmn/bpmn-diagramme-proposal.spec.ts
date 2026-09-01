import { construirePropositionDiagramme, decouperEtapes, MAX_ETAPES } from './bpmn-diagramme-proposal';

describe('construirePropositionDiagramme', () => {
  it('encadre les étapes d\'un événement de début et de fin', () => {
    const { noeuds } = construirePropositionDiagramme('Recevoir la commande\nPréparer le colis');

    expect(noeuds).toHaveLength(4);
    expect(noeuds[0].type).toBe('EVENEMENT_DEBUT');
    expect(noeuds[noeuds.length - 1].type).toBe('EVENEMENT_FIN');
  });

  it('relie les nœuds séquentiellement pour des étapes simples', () => {
    const { noeuds, liens } = construirePropositionDiagramme('Étape A\nÉtape B\nÉtape C');

    expect(liens.map((l) => [l.source, l.cible])).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ]);
    expect(liens).toHaveLength(noeuds.length - 1);
  });

  it('transforme une étape interrogative ou conditionnelle sans branche en passerelle exclusive', () => {
    const { noeuds } = construirePropositionDiagramme('Le dossier est-il complet ?\nSi rejeté, notifier le client');

    expect(noeuds[1].type).toBe('PASSERELLE_EXCLUSIVE');
    expect(noeuds[2].type).toBe('PASSERELLE_EXCLUSIVE');
  });

  it('devine la nature de la tâche par mots-clés', () => {
    const { noeuds } = construirePropositionDiagramme(
      [
        'Valider la demande',
        'Envoyer un e-mail de confirmation',
        'Recevoir la réponse par courriel',
        'Générer la facture',
        'Emballer le produit',
      ].join('\n'),
    );

    expect(noeuds[1]).toMatchObject({ type: 'TACHE', typeTache: 'UTILISATEUR' });
    expect(noeuds[2]).toMatchObject({ type: 'TACHE', typeTache: 'ENVOI' });
    expect(noeuds[3]).toMatchObject({ type: 'TACHE', typeTache: 'RECEPTION' });
    expect(noeuds[4]).toMatchObject({ type: 'TACHE', typeTache: 'SERVICE' });
    expect(noeuds[5]).toEqual(expect.objectContaining({ type: 'TACHE' }));
    expect(noeuds[5].typeTache).toBeUndefined();
  });

  it('ignore les puces, numéros et lignes vides', () => {
    expect(decouperEtapes('- Étape A\n\n2. Étape B\n  * Étape C  ')).toEqual(['Étape A', 'Étape B', 'Étape C']);
  });

  it('attribue des positions croissantes de gauche à droite', () => {
    const { noeuds } = construirePropositionDiagramme('Étape A\nÉtape B');

    expect(noeuds[1].x).toBeGreaterThan(noeuds[0].x);
    expect(noeuds[0].y).toBe(noeuds[1].y);
  });

  // ── Passerelles ────────────────────────────────────────────────────────────

  it('génère une passerelle exclusive avec branches libellées et une fusion', () => {
    const { noeuds, liens } = construirePropositionDiagramme(
      [
        'Recevoir la demande',
        'Le dossier est-il complet ?',
        '= Oui : Instruire la demande',
        '= Non : Réclamer les pièces',
        'Notifier la décision',
      ].join('\n'),
    );

    expect(noeuds.filter((n) => n.type === 'PASSERELLE_EXCLUSIVE')).toHaveLength(2); // divergence + fusion

    const divergence = noeuds.findIndex((n) => n.nom === 'Le dossier est-il complet ?');
    const sorties = liens.filter((l) => l.source === divergence);
    expect(sorties.map((l) => l.label).sort()).toEqual(['Non', 'Oui']);

    expect(noeuds.some((n) => n.nom === 'Instruire la demande')).toBe(true);
    expect(noeuds.some((n) => n.nom === 'Réclamer les pièces')).toBe(true);

    const fusion = noeuds.map((n, i) => ({ n, i })).filter(({ n }) => n.nom === 'Fusion');
    expect(fusion).toHaveLength(1);
    expect(liens.filter((l) => l.cible === fusion[0].i)).toHaveLength(2);
  });

  it('découpe les étapes multiples d\'une branche sur « ; »', () => {
    const { noeuds } = construirePropositionDiagramme(
      ['Décision à prendre ?', '= Oui : Étape 1 ; Étape 2 ; Étape 3', '= Non : Abandonner', 'Clore'].join('\n'),
    );

    for (const nom of ['Étape 1', 'Étape 2', 'Étape 3', 'Abandonner']) {
      expect(noeuds.some((n) => n.nom === nom)).toBe(true);
    }
  });

  it('crée un flux de retour pour une branche « → "étape" » (boucle)', () => {
    const { noeuds, liens } = construirePropositionDiagramme(
      [
        'Vérifier le dossier',
        'Le dossier est-il complet ?',
        '= Oui : Instruire la demande',
        '= Non : Réclamer les pièces ; → "Vérifier le dossier"',
        'Notifier la décision',
      ].join('\n'),
    );

    const verif = noeuds.findIndex((n) => n.nom === 'Vérifier le dossier');
    const reclamer = noeuds.findIndex((n) => n.nom === 'Réclamer les pièces');

    expect(noeuds.filter((n) => n.nom === 'Vérifier le dossier')).toHaveLength(1); // pas de doublon
    expect(liens).toContainEqual(expect.objectContaining({ source: reclamer, cible: verif }));
  });

  it('génère une passerelle parallèle pour « En parallèle : »', () => {
    const { noeuds, liens } = construirePropositionDiagramme(
      [
        'Préparer la commande',
        'En parallèle :',
        '= Éditer la facture',
        '= Emballer les articles',
        'Expédier le colis',
      ].join('\n'),
    );

    const paralleles = noeuds.filter((n) => n.type === 'PASSERELLE_PARALLELE');
    expect(paralleles).toHaveLength(2); // divergence + jonction
    expect(noeuds.map((n) => n.nom)).toEqual(expect.arrayContaining(['Éditer la facture', 'Emballer les articles']));

    const idxDivergence = noeuds.findIndex((n) => n.type === 'PASSERELLE_PARALLELE');
    const idxJonction = noeuds.length - 1 - [...noeuds].reverse().findIndex((n) => n.type === 'PASSERELLE_PARALLELE');
    expect(idxJonction).toBeGreaterThan(idxDivergence);
    expect(liens.filter((l) => l.source === idxDivergence)).toHaveLength(2);
    expect(liens.filter((l) => l.cible === idxJonction)).toHaveLength(2);

    // la jonction est placée à droite des branches (couches cohérentes)
    const branche = noeuds.findIndex((n) => n.nom === 'Éditer la facture');
    expect(noeuds[idxJonction].x).toBeGreaterThan(noeuds[branche].x);
    expect(noeuds[idxDivergence].x).toBeLessThan(noeuds[branche].x);
  });

  // ── Rejets ────────────────────────────────────────────────────────────────

  it('rejette une saisie sans étape exploitable', () => {
    expect(() => construirePropositionDiagramme('   \n\n')).toThrow();
  });

  it(`rejette au-delà de ${MAX_ETAPES} étapes`, () => {
    const trop = Array.from({ length: MAX_ETAPES + 1 }, (_, i) => `Étape ${i}`).join('\n');
    expect(() => construirePropositionDiagramme(trop)).toThrow();
  });

  it('rejette une décision à une seule branche', () => {
    expect(() => construirePropositionDiagramme('Décider ?\n= Oui : Faire')).toThrow();
  });

  it('rejette une branche « = ... » sans décision au-dessus', () => {
    expect(() => construirePropositionDiagramme('Faire un truc\n= Oui : Autre chose')).toThrow();
  });

  it('rejette un retour vers une étape inconnue', () => {
    expect(() =>
      construirePropositionDiagramme('Étape A\nContinuer ?\n= Oui : Avancer\n= Non : → "Étape Z"'),
    ).toThrow();
  });
});
