import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    title: 'Inicia sesión · Euphony',
    loadComponent: () => import('@features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'home',
    title: 'Home · Euphony',
    loadComponent: () => import('@features/home/home').then((m) => m.Home),
  },
  {
    path: 'player',
    title: 'Player · Euphony',
    loadComponent: () => import('@features/player/player').then((m) => m.Player),
  },
  {
    path: '**',
    title: 'Página no encontrada · Euphony',
    loadComponent: () => import('@features/not-found/not-found').then((m) => m.NotFound),
  },
];
