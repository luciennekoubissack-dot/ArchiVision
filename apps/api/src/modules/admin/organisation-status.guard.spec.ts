import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@archivision/infrastructure';
import {
  OrganisationStatusGuard,
  IS_PUBLIC_KEY,
  ALLOW_PENDING_ORG_KEY,
} from '@archivision/shared';

describe('OrganisationStatusGuard', () => {
  let guard: OrganisationStatusGuard;
  const getAllAndOverride = jest.fn();
  const reflectorMock = { getAllAndOverride } as unknown as Reflector;
  const findUnique = jest.fn();
  const prismaMock = { organisation: { findUnique } } as unknown as PrismaService;

  const buildContext = (user?: { role: string; organisationId: string | null }): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new OrganisationStatusGuard(reflectorMock, prismaMock);
  });

  it('laisse passer une route publique sans requête base', async () => {
    getAllAndOverride.mockImplementation((key: string) => key === IS_PUBLIC_KEY);

    await expect(guard.canActivate(buildContext(undefined))).resolves.toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('laisse passer une route @AllowPendingOrganisation()', async () => {
    getAllAndOverride.mockImplementation((key: string) => key === ALLOW_PENDING_ORG_KEY);

    await expect(
      guard.canActivate(buildContext({ role: 'ADMINISTRATEUR', organisationId: 'org-1' })),
    ).resolves.toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('laisse passer le SUPERADMIN sans organisation', async () => {
    getAllAndOverride.mockReturnValue(false);

    await expect(
      guard.canActivate(buildContext({ role: 'SUPERADMIN', organisationId: null })),
    ).resolves.toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('autorise un utilisateur dont l\'organisation est VALIDEE', async () => {
    getAllAndOverride.mockReturnValue(false);
    findUnique.mockResolvedValue({ statut: 'VALIDEE' });

    await expect(
      guard.canActivate(buildContext({ role: 'ADMINISTRATEUR', organisationId: 'org-1' })),
    ).resolves.toBe(true);
  });

  it('bloque un utilisateur dont l\'organisation est EN_ATTENTE', async () => {
    getAllAndOverride.mockReturnValue(false);
    findUnique.mockResolvedValue({ statut: 'EN_ATTENTE' });

    await expect(
      guard.canActivate(buildContext({ role: 'ADMINISTRATEUR', organisationId: 'org-1' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('bloque un utilisateur dont l\'organisation est REJETEE', async () => {
    getAllAndOverride.mockReturnValue(false);
    findUnique.mockResolvedValue({ statut: 'REJETEE' });

    await expect(
      guard.canActivate(buildContext({ role: 'ARCHITECTE', organisationId: 'org-1' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('bloque si l\'organisation est introuvable', async () => {
    getAllAndOverride.mockReturnValue(false);
    findUnique.mockResolvedValue(null);

    await expect(
      guard.canActivate(buildContext({ role: 'ADMINISTRATEUR', organisationId: 'org-1' })),
    ).rejects.toThrow(ForbiddenException);
  });
});
