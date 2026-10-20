import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { devBackendInterceptor } from './core/mock/dev-backend.interceptor';
import { provideDevSeed } from './core/providers/dev-seed.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([devBackendInterceptor])),
    provideDevSeed(),
  ],
};
