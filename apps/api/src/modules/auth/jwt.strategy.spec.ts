import { ConfigService } from '@nestjs/config';
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
    it('retourne { sub, email } à partir du payload JWT', () => {
      const strategy = new JwtStrategy(configMock);
      const payload = { sub: 'user-001', email: 'admin@archivision.local' };

      const result = strategy.validate(payload);

      expect(result).toEqual({ sub: 'user-001', email: 'admin@archivision.local' });
    });

    it('ignore les champs superflus du payload', () => {
      const strategy = new JwtStrategy(configMock);
      const payload = {
        sub: 'user-001',
        email: 'admin@archivision.local',
        iat: 123,
        exp: 456,
      } as unknown as { sub: string; email: string };

      const result = strategy.validate(payload);

      expect(result).toEqual({ sub: 'user-001', email: 'admin@archivision.local' });
    });
  });
});
