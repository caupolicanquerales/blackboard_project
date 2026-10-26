import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/workspace/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/performance-telemetry-dashboard/performance-telemetry-dashboard.routes').then(
            m => m.PERFORMANCE_TELEMETRY_DASHBOARD_ROUTES
          ),
      },
      {
        path: 'routines',
        loadChildren: () =>
          import('./features/workout-progression-routines/workout-progression-routines.routes').then(
            m => m.WORKOUT_PROGRESSION_ROUTINES_ROUTES
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
