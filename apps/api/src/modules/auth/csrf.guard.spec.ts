import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard, CSRF_COOKIE_NAME } from '@archivision/shared';

describe('CsrfGuard', () => {
  let guard: CsrfGuard;
  const getAllAndOverride = jest.fn();
  const reflectorMock = { getAllAndOverride } as unknown as Reflector;

  const buildContext = (options: {
    method?: string;
    isPublic?: boolean;
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
  }): ExecutionContext => {
    getAllAndOverride.mockReturnValue(options.isPublic ?? false);
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method: options.method ?? 'POST',
          cookies: options.cookies ?? {},
          headers: options.headers ?? {},
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new CsrfGuard(reflectorMock);
  });

  it('laisse passer les méthodes sûres (GET) sans vérification', () => {
    expect(guard.canActivate(buildContext({ method: 'GET' }))).toBe(true);
  });

  it('laisse passer une route publique sans vérification', () => {
    expect(guard.canActivate(buildContext({ isPublic: true, cookies: {} }))).toBe(true);
  });

  it("laisse passer une requête authentifiée par en-tête Bearer, sans cookie CSRF", () => {
    const context = buildContext({ headers: { authorization: 'Bearer un-token' } });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejette une requête de mutation sans cookie CSRF', () => {
    const context = buildContext({ cookies: {} });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("rejette une requête dont le cookie CSRF et l'en-tête ne correspondent pas", () => {
    const context = buildContext({
      cookies: { [CSRF_COOKIE_NAME]: 'valeur-cookie' },
      headers: { 'x-xsrf-token': 'valeur-differente' },
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('accepte une requête dont le cookie CSRF et l\'en-tête correspondent', () => {
    const context = buildContext({
      cookies: { [CSRF_COOKIE_NAME]: 'meme-valeur' },
      headers: { 'x-xsrf-token': 'meme-valeur' },
    });
    expect(guard.canActivate(context)).toBe(true);
  });
});
