import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'erm/:formId',
    loadComponent: () =>
      import('./pages/erm/erm.component').then(m => m.ErmComponent),
  },
  {
    path: 'erm',
    redirectTo: 'erm/3002443',
    pathMatch: 'full',
  },
];
