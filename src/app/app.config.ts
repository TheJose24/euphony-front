import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { lucideIconsProvider } from '@shared/icons/lucide-icons';
import { httpErrorInterceptor } from '@core/api/http-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // This app ships no zone.js; signals drive change detection. Without this
    // provider, async signal updates (HTTP responses, audio events) don't refresh
    // the view — e.g. the song list stays stuck on "Cargando…".
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withFetch(), withInterceptors([httpErrorInterceptor])),
    lucideIconsProvider,
  ],
};
