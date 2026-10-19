import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
  },
  {
    path: 'routines',
    loadChildren: () =>
      import('./features/routines/routines.routes').then(m => m.ROUTINES_ROUTES),
  },
  { path: '**', redirectTo: 'dashboard' },
];
