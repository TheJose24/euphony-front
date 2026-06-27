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
    path: 'browse',
    title: 'Explorar · Euphony',
    loadComponent: () => import('@features/browse/browse').then((m) => m.Browse),
  },
  {
    path: 'search',
    title: 'Buscar · Euphony',
    loadComponent: () => import('@features/search/search').then((m) => m.Search),
  },
  {
    path: 'album/:id',
    title: 'Álbum · Euphony',
    loadComponent: () => import('@features/album-detail/album-detail').then((m) => m.AlbumDetail),
  },
  {
    path: 'artist/:id',
    title: 'Artista · Euphony',
    loadComponent: () => import('@features/artist-detail/artist-detail').then((m) => m.ArtistDetail),
  },
  {
    path: 'library',
    title: 'Tu biblioteca · Euphony',
    loadComponent: () => import('@features/library/library').then((m) => m.Library),
  },
  {
    path: 'playlist/:id',
    title: 'Playlist · Euphony',
    loadComponent: () =>
      import('@features/playlists/playlist-detail/playlist-detail').then((m) => m.PlaylistDetail),
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
