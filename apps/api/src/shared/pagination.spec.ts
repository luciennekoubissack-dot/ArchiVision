import { paginateFindMany, paginationArgs } from '@archivision/shared';

describe('paginationArgs', () => {
  it('applique page=1 et pageSize=20 par défaut', () => {
    expect(paginationArgs()).toEqual({ skip: 0, take: 20, page: 1, pageSize: 20 });
  });

  it('calcule skip/take à partir de page et pageSize fournis', () => {
    expect(paginationArgs({ page: 3, pageSize: 10 })).toEqual({ skip: 20, take: 10, page: 3, pageSize: 10 });
  });
});

describe('paginateFindMany', () => {
  const items = [{ id: '1' }, { id: '2' }];
  const buildDelegate = () => ({
    findMany: jest.fn().mockResolvedValue(items),
    count: jest.fn().mockResolvedValue(42),
  });

  it("sans pagination fournie, renvoie directement le tableau (comportement historique pour les canevas/diagrammes)", async () => {
    const delegate = buildDelegate();
    const baseArgs = { where: { organisationId: 'org-1' }, orderBy: { nom: 'asc' as const } };

    const result = await paginateFindMany(delegate, baseArgs);

    expect(result).toBe(items);
    expect(delegate.findMany).toHaveBeenCalledWith(baseArgs);
    expect(delegate.count).not.toHaveBeenCalled();
  });

  it('avec `page` fourni, renvoie { items, total, page, pageSize } et applique skip/take', async () => {
    const delegate = buildDelegate();
    const baseArgs = { where: { organisationId: 'org-1' } };

    const result = await paginateFindMany(delegate, baseArgs, { page: 2, pageSize: 5 });

    expect(result).toEqual({ items, total: 42, page: 2, pageSize: 5 });
    expect(delegate.findMany).toHaveBeenCalledWith({ where: { organisationId: 'org-1' }, skip: 5, take: 5 });
    expect(delegate.count).toHaveBeenCalledWith({ where: { organisationId: 'org-1' } });
  });

  it('sans `page` explicite dans la requête de pagination, se comporte comme sans pagination du tout', async () => {
    const delegate = buildDelegate();
    const baseArgs = { where: {} };

    const result = await paginateFindMany(delegate, baseArgs, { pageSize: 5 });

    expect(result).toBe(items);
    expect(delegate.count).not.toHaveBeenCalled();
  });
});
