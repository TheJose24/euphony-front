# Playlists — sidebar + detalle (`/playlist/:id`) — overrides

> Delta sobre [MASTER](../MASTER.md). CRUD completo contra `/api/v1/playlists` (incluye canciones).

## Estado de datos
- **`PlaylistsService`** ([playlists.service.ts](../../src/app/core/api/playlists.service.ts)): CRUD
  (`/all`, `/user/{userId}`, `/search/{id}`, `/create`, `/update/{id}`, `/delete/{id}`) + canciones
  (`GET/POST /{id}/songs`, `DELETE /{id}/songs/{songId}`). Add/remove **idempotentes**, sin body.
- **`PlaylistsStore`** ([playlists.store.ts](../../src/app/core/state/playlists.store.ts)): playlists del
  usuario (`getByUser`), `create(name)`, `remove(id)` (optimista), `refresh()` (re-lee tras añadir
  canciones para actualizar `songCount`). Optimista + toast.

## Sidebar (sección "MY PLAYLIST")
[sidebar.html](../../src/app/layout/sidebar/sidebar.html) — lista las playlists reales del store, cada
una enlaza a `/playlist/:id` (con punto de color rotando por índice) y un botón **borrar** (trash, en
hover). El botón **+** del encabezado abre un `<app-modal>` con un input de nombre (mín. 3 chars) →
`PlaylistsStore.create`.

## Detalle (`/playlist/:id`)
[playlist-detail.ts](../../src/app/features/playlists/playlist-detail/playlist-detail.ts) — patrón
header + lista (igual que album-detail):
- Header: cover (`coverImage` URL; fallback `list-music` sobre gradiente de superficie), nombre
  `font-display`, descripción, nº de canciones, botón **Reproducir** (encola toda la playlist).
- Cuerpo: `<app-track-table>` con `likedIds`/`favoriteToggle` del `FavoritesStore`; vacío →
  `<app-empty-state>` que invita a añadir desde el menú ⋯.

## Añadir canciones
Desde el menú ⋯ de cualquier fila de `track-table`: **"Añadir a playlist"** abre el picker global
(`PlaylistPickerService.open(track)` → `<app-playlist-picker>`), que lista las playlists y añade vía
`POST /{id}/songs`. También **"Añadir a la cola"** (`PlayerStore.enqueue`).

## Notas / deuda
- ✅ (P2) CRUD de playlist + canciones (add desde picker, view + play en detalle).
- Pendiente (refinamiento): **editar** metadatos de playlist, **quitar** canción desde el detalle
  (la API `DELETE /{id}/songs/{songId}` ya existe; falta el control en `track-table`), y reordenar.
- Crear playlist hoy se hace desde la sidebar (visible solo en `lg+`); en móvil se navega por `bottom-nav`.