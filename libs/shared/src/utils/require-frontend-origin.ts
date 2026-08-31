import { ConfigService } from '@nestjs/config';

/**
 * `FRONTEND_ORIGIN` n'a pas de valeur par défaut : un repli silencieux sur
 * `http://localhost:4201` masquerait un oubli de configuration en
 * production (le vrai frontend serait bloqué par CORS sans message clair
 * au démarrage). On préfère un échec explicite, comme pour `JWT_SECRET`.
 */
export function requireFrontendOrigin(config: ConfigService): string {
  const origin = config.get<string>('FRONTEND_ORIGIN');
  if (!origin) {
    throw new Error(
      "FRONTEND_ORIGIN est absent des variables d'environnement. L'API refuse de démarrer sans origine CORS explicite.",
    );
  }
  return origin;
}
