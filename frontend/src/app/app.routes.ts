import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'form/:formId',
    loadComponent: () =>
      import('./pages/form-view/form-view.component').then(m => m.FormViewComponent),
  },
  // Legacy alias — keeps existing /erm/... URLs working
  {
    path: 'erm/:formId',
    redirectTo: 'form/:formId',
  },
  {
    path: 'erm',
    redirectTo: 'form/3002443',
    pathMatch: 'full',
  },
];
