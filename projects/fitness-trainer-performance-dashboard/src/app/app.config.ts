import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { devApiInterceptor } from './core/mock/dev-api.interceptor';
import { provideDevSeed } from './core/mock/dev-seed.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([devApiInterceptor])),
    provideDevSeed(),
  ],
};
