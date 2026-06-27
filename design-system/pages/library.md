# Página: Tu biblioteca (`/library`) — overrides

> Delta sobre [MASTER](../MASTER.md). Agrega todo lo que el usuario ha coleccionado, leyendo de los
> stores compartidos (no hace fetch propio). Componente:
> [library.ts](../../src/app/features/library/library.ts).

## Layout
Dentro de `<app-layout [(query)]>`. Encabezado tipo browse (`text-3xl font-extrabold`, **no** display)
+ `<app-content-tabs>` reutilizado con 4 tabs:

| Tab | Origen (store) | Render |
|-----|----------------|--------|
| Canciones | `FavoritesStore` (likes) | `<app-track-table>` (encola al reproducir, like sincronizado) |
| Álbumes | `AlbumFavoritesStore` | grid de `<app-album-card>` (con su corazón) |
| Playlists | `PlaylistsStore` | grid de cards inline (cover/`list-music` + nombre + `songCount`) → `/playlist/:id` |
| Artistas | `FollowStore` | grid de `<app-artist-card>` (se mapea `FollowersArtistResponseDTO` → `ArtistTile`) |

Cada tab usa el trío `loading-state` / `error-state` (retry → `store.load()`) / `empty-state`, y
**filtra por la query del shell** (buscador superior).

## Navegación / deep-link
- La sidebar enruta **Likes / Playlists / Albums / Following** a `/library?tab=…`; la página lee el
  query param `tab` (`route.queryParamMap`) para preseleccionar la pestaña.
- `bottom-nav` (móvil) tiene **Biblioteca** (`library` icon).

## Notas
- No duplica estado: todo sale de los stores P1/P2 (likes, álbumes favoritos, follow, playlists), así
  que se mantiene en sync con acciones hechas en otras pantallas.
- Artistas seguidos solo traen `artistId` + `artistName` del backend → se mapea a un `ArtistTile`
  mínimo (sin país/imagen) para reutilizar `artist-card`.