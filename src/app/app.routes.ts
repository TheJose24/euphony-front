import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    title: 'Inicia sesión · Euphony',
    canActivate: [guestGuard],
    loadComponent: () => import('@features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'home',
    title: 'Home · Euphony',
    canActivate: [authGuard],
    loadComponent: () => import('@features/home/home').then((m) => m.Home),
  },
  {
    path: 'browse',
    title: 'Explorar · Euphony',
    canActivate: [authGuard],
    loadComponent: () => import('@features/browse/browse').then((m) => m.Browse),
  },
  {
    path: 'search',
    title: 'Buscar · Euphony',
    canActivate: [authGuard],
    loadComponent: () => import('@features/search/search').then((m) => m.Search),
  },
  {
    path: 'album/:id',
    title: 'Álbum · Euphony',
    canActivate: [authGuard],
    loadComponent: () => import('@features/album-detail/album-detail').then((m) => m.AlbumDetail),
  },
  {
    path: 'artist/:id',
    title: 'Artista · Euphony',
    canActivate: [authGuard],
    loadComponent: () => import('@features/artist-detail/artist-detail').then((m) => m.ArtistDetail),
  },
  {
    path: 'library',
    title: 'Tu biblioteca · Euphony',
    canActivate: [authGuard],
    loadComponent: () => import('@features/library/library').then((m) => m.Library),
  },
  {
    path: 'playlist/:id',
    title: 'Playlist · Euphony',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/playlists/playlist-detail/playlist-detail').then((m) => m.PlaylistDetail),
  },
  {
    path: 'player',
    title: 'Player · Euphony',
    canActivate: [authGuard],
    loadComponent: () => import('@features/player/player').then((m) => m.Player),
  },
  {
    path: '**',
    title: 'Página no encontrada · Euphony',
    loadComponent: () => import('@features/not-found/not-found').then((m) => m.NotFound),
  },
];
