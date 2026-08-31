import { Request, Response, NextFunction } from 'express';

/**
 * Limiteur de débit minimal, en mémoire, pour des routes qui vivent hors du
 * pipeline de guards Nest (ex. Swagger, monté directement sur l'adaptateur
 * HTTP). Pas de Redis dans cette stack (voir docker-compose.yml) : une
 * fenêtre fixe par IP en mémoire suffit pour une route de lecture seule à
 * faible risque, l'objectif est d'éviter un scraping trivial, pas de
 * protéger un endpoint sensible (voir ThrottlerGuard pour ça).
 */
export function createSimpleRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function simpleRateLimit(req: Request, res: Response, next: NextFunction): void {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= limit) {
      res.status(429).json({ statusCode: 429, message: 'Trop de requêtes, réessayez plus tard.' });
      return;
    }

    entry.count += 1;
    next();
  };
}
