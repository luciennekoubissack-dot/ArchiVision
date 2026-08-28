import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi, withXsrfConfiguration } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthInterceptor } from '../auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    provideRouter(routes),
    // Noms de cookie/en-tête alignés avec setAuthCookies()/CsrfGuard côté API
    // (libs/shared/src/utils/auth-cookies.ts, libs/shared/src/guards/csrf.guard.ts).
    provideHttpClient(
      withInterceptorsFromDi(),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
};
