import { inferForeignKeyRelations } from './donnees-relations.util';

const ent = (id: string, nom: string, attrs: string[] = []) => ({
  id,
  nom,
  attributs: attrs.map((nom) => ({ nom })),
});

describe('inferForeignKeyRelations', () => {
  it('déduit une relation 1-N depuis un attribut clé étrangère (xId)', () => {
    const rels = inferForeignKeyRelations(
      [ent('c', 'Client'), ent('o', 'Commande', ['numero', 'clientId'])],
      [],
    );
    expect(rels).toEqual([
      { sourceId: 'c', targetId: 'o', cardinalite: 'UN_A_PLUSIEURS', label: 'clientId' },
    ]);
  });

  it('reconnaît x_id, idX, id_x et le pluriel de l\'entité', () => {
    expect(
      inferForeignKeyRelations([ent('c', 'Clients'), ent('o', 'Commande', ['client_id'])], []),
    ).toHaveLength(1);
    expect(
      inferForeignKeyRelations([ent('c', 'Client'), ent('o', 'Commande', ['idClient'])], []),
    ).toHaveLength(1);
    expect(
      inferForeignKeyRelations([ent('c', 'Client'), ent('o', 'Commande', ['id_client'])], []),
    ).toHaveLength(1);
  });

  it('est insensible aux accents et à la casse', () => {
    const rels = inferForeignKeyRelations(
      [ent('u', 'Société'), ent('e', 'Employé', ['SOCIETE_ID'])],
      [],
    );
    expect(rels).toHaveLength(1);
    expect(rels[0]).toMatchObject({ sourceId: 'u', targetId: 'e' });
  });

  it("n'ajoute pas de relation si une existe déjà (quel que soit le sens)", () => {
    const rels = inferForeignKeyRelations(
      [ent('c', 'Client'), ent('o', 'Commande', ['clientId'])],
      [{ sourceId: 'o', targetId: 'c' }],
    );
    expect(rels).toEqual([]);
  });

  it('ignore les attributs sans motif de clé étrangère et les auto-références', () => {
    const rels = inferForeignKeyRelations(
      [ent('c', 'Client', ['nom', 'email', 'clientId'])],
      [],
    );
    expect(rels).toEqual([]);
  });

  it('ne crée qu\'une relation par paire même avec plusieurs attributs FK', () => {
    const rels = inferForeignKeyRelations(
      [ent('c', 'Client'), ent('o', 'Commande', ['clientId', 'client_ref'])],
      [],
    );
    expect(rels).toHaveLength(1);
  });
});
