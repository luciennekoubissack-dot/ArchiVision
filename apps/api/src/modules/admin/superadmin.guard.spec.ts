import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SuperAdminGuard, IS_PUBLIC_KEY, SUPERADMIN_ROUTE_KEY } from '@archivision/shared';

describe('SuperAdminGuard', () => {
  let guard: SuperAdminGuard;
  const getAllAndOverride = jest.fn();
  const reflectorMock = { getAllAndOverride } as unknown as Reflector;

  const buildContext = (user?: { role: string }): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new SuperAdminGuard(reflectorMock);
  });

  it('laisse passer une route publique sans lire request.user', () => {
    getAllAndOverride.mockImplementation((key: string) => key === IS_PUBLIC_KEY);

    expect(guard.canActivate(buildContext(undefined))).toBe(true);
  });

  it('laisse passer si request.user est absent (délégué à JwtAuthGuard)', () => {
    getAllAndOverride.mockReturnValue(false);

    expect(guard.canActivate(buildContext(undefined))).toBe(true);
  });

  it('bloque un SUPERADMIN sur une route tenant classique', () => {
    getAllAndOverride.mockReturnValue(false);

    expect(() => guard.canActivate(buildContext({ role: 'SUPERADMIN' }))).toThrow(ForbiddenException);
  });

  it('autorise un SUPERADMIN sur une route @SuperAdminRoute()', () => {
    getAllAndOverride.mockImplementation((key: string) => key === SUPERADMIN_ROUTE_KEY);

    expect(guard.canActivate(buildContext({ role: 'SUPERADMIN' }))).toBe(true);
  });

  it('bloque un utilisateur non-SUPERADMIN sur une route @SuperAdminRoute()', () => {
    getAllAndOverride.mockImplementation((key: string) => key === SUPERADMIN_ROUTE_KEY);

    expect(() => guard.canActivate(buildContext({ role: 'ADMINISTRATEUR' }))).toThrow(ForbiddenException);
  });

  it('autorise un utilisateur tenant sur une route tenant classique', () => {
    getAllAndOverride.mockReturnValue(false);

    expect(guard.canActivate(buildContext({ role: 'ADMINISTRATEUR' }))).toBe(true);
  });
});
