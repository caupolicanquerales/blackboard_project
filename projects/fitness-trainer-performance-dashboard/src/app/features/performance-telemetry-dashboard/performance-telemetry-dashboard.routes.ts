import { Routes } from '@angular/router';

export const PERFORMANCE_TELEMETRY_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature/dashboard-page.component').then(m => m.DashboardPageComponent),
  },
];
