import { ConfigService } from '@nestjs/config';

/**
 * `JWT_SECRET` n'a jamais de valeur par défaut : un secret cryptographique
 * connu de quiconque lit le repo permettrait de forger des tokens, y
 * compris SUPERADMIN. Si la variable d'env est absente, on préfère un
 * échec explicite au démarrage à une API qui tourne avec un secret public.
 */
export function requireJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET');
  if (!secret) {
    throw new Error(
      "JWT_SECRET est absent des variables d'environnement. L'API refuse de démarrer avec un secret par défaut connu.",
    );
  }
  return secret;
}
