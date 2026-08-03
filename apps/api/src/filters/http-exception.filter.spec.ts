import { ArgumentsHost, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HttpExceptionFilter } from '@archivision/shared';

function buildHost(url = '/organisations/123') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const request = { url, method: 'GET' };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('formate une HttpException métier (NotFoundException)', () => {
    const { host, status, json } = buildHost();

    filter.catch(new NotFoundException('Organisation introuvable'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Organisation introuvable',
        path: '/organisations/123',
      }),
    );
  });

  it('mappe une erreur Prisma P2002 (contrainte unique) en 409', () => {
    const { host, status, json } = buildHost();
    const prismaError = Object.create(Prisma.PrismaClientKnownRequestError.prototype);
    prismaError.code = 'P2002';

    filter.catch(prismaError, host);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, error: 'Conflict' }),
    );
  });

  it('mappe une erreur Prisma P2025 (non trouvé) en 404', () => {
    const { host, status } = buildHost();
    const prismaError = Object.create(Prisma.PrismaClientKnownRequestError.prototype);
    prismaError.code = 'P2025';

    filter.catch(prismaError, host);

    expect(status).toHaveBeenCalledWith(404);
  });

  it('ne laisse fuiter aucun détail interne pour une erreur inattendue (500 générique)', () => {
    const { host, status, json } = buildHost();

    filter.catch(new Error('Détail technique sensible : connexion DB refusée'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, message: 'Erreur interne du serveur' }),
    );
    const body = json.mock.calls[0][0];
    expect(JSON.stringify(body)).not.toContain('connexion DB refusée');
  });

  it('inclut toujours path et timestamp dans le corps de réponse', () => {
    const { host, json } = buildHost('/elements-archimate');

    filter.catch(new NotFoundException(), host);

    const body = json.mock.calls[0][0];
    expect(body.path).toBe('/elements-archimate');
    expect(typeof body.timestamp).toBe('string');
  });
});
