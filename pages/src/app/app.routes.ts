import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'MicroPDF - High-Performance PDF Library'
  },
  {
    path: 'docs',
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/docs/docs.component').then(m => m.DocsComponent),
        title: 'Documentation - MicroPDF'
      },
      {
        path: 'getting-started',
        loadComponent: () => import('./pages/docs/getting-started/getting-started.component').then(m => m.GettingStartedComponent),
        title: 'Getting Started - MicroPDF'
      },
      {
        path: 'rust',
        loadComponent: () => import('./pages/docs/rust/rust.component').then(m => m.RustComponent),
        title: 'Rust Documentation - MicroPDF'
      },
      {
        path: 'javascript',
        loadComponent: () => import('./pages/docs/javascript/javascript.component').then(m => m.JavascriptComponent),
        title: 'JavaScript Documentation - MicroPDF'
      },
      {
        path: 'go',
        loadComponent: () => import('./pages/docs/go/go.component').then(m => m.GoComponent),
        title: 'Go Documentation - MicroPDF'
      }
    ]
  },
  {
    path: 'api',
    loadComponent: () => import('./pages/api/api.component').then(m => m.ApiComponent),
    title: 'API Reference - MicroPDF'
  },
  {
    path: 'benchmarks',
    loadComponent: () => import('./pages/benchmarks/benchmarks.component').then(m => m.BenchmarksComponent),
    title: 'Benchmarks - MicroPDF'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
