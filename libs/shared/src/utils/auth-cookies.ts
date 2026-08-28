import { Response } from 'express';
import { randomBytes } from 'crypto';
import { CSRF_COOKIE_NAME } from '../guards/csrf.guard';

export const ACCESS_TOKEN_COOKIE_NAME = 'access_token';

/** Durée de vie du cookie alignée sur celle du JWT (signOptions.expiresIn: '8h' dans auth.module.ts). */
const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000;

/**
 * Pose le cookie d'authentification (httpOnly, illisible en JS : protège du
 * vol de token par XSS) et le cookie CSRF associé (lisible en JS : Angular
 * le renvoie dans l'en-tête X-XSRF-TOKEN, voir csrf.guard.ts).
 */
export function setAuthCookies(res: Response, accessToken: string): void {
  const secure = process.env.NODE_ENV === 'production';

  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });

  res.cookie(CSRF_COOKIE_NAME, randomBytes(24).toString('base64url'), {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, { path: '/' });
  res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
}
