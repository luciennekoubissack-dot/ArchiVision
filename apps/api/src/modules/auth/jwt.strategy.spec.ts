import { ConfigService } from '@nestjs/config';
import { RoleUtilisateur } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const configMock = {
    get: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;

  it('se construit avec le secret issu de la configuration', () => {
    const strategy = new JwtStrategy(configMock);
    expect(strategy).toBeDefined();
  });

  it('utilise une clé par défaut si JWT_SECRET est absent', () => {
    const configWithoutSecret = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    expect(() => new JwtStrategy(configWithoutSecret)).not.toThrow();
  });

  describe('validate', () => {
    it('retourne { sub, email, organisationId, role } à partir du payload JWT', () => {
      const strategy = new JwtStrategy(configMock);
      const payload = {
        sub: 'user-001',
        email: 'admin@archivision.local',
        organisationId: 'org-001',
        role: RoleUtilisateur.ARCHITECTE,
      };

      const result = strategy.validate(payload);

      expect(result).toEqual(payload);
    });

    it('ignore les champs superflus du payload', () => {
      const strategy = new JwtStrategy(configMock);
      const payload = {
        sub: 'user-001',
        email: 'admin@archivision.local',
        organisationId: 'org-001',
        role: RoleUtilisateur.ARCHITECTE,
        iat: 123,
        exp: 456,
      } as unknown as { sub: string; email: string; organisationId: string; role: RoleUtilisateur };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        sub: 'user-001',
        email: 'admin@archivision.local',
        organisationId: 'org-001',
        role: RoleUtilisateur.ARCHITECTE,
      });
    });
  });
});
