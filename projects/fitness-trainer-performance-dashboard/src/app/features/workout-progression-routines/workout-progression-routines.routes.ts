import { Routes } from '@angular/router';

export const WORKOUT_PROGRESSION_ROUTINES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./feature/routines-page.component').then(m => m.RoutinesPageComponent),
  },
];
