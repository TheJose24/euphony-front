# Página: Artist detail (`/artist/:id`) — overrides

> Delta sobre [MASTER](../MASTER.md). Componente:
> [artist-detail.ts](../../src/app/features/artist-detail/artist-detail.ts).

## Layout
Dentro de `<app-layout>`. Patrón **header de artista + contenido**:

1. **Header de artista:** imagen del artista (`imageUrl` del DTO; fallback inicial en `text-primary`),
   nombre con `.display-title`/`font-display`, badge `badge-check` (`text-primary`) si verificado,
   país, biografía, redes sociales. ✅ Botón **Seguir / Siguiendo** cableado al `FollowStore` (P2).
2. **Álbumes del artista** → grid de `<app-album-card>` (ver MASTER §6).
3. **Canciones** → `<app-track-table>`.

## Datos
- **Real:** artista por id + `GET /api/v1/songs/search/by-artist/{artistId}` (DTO enriquecido).
- `imageUrl` ya existe en `ArtistResponseDTO`.

## Notas
- ✅ (P2) Follow/unfollow cableado: `FollowersService` + `FollowStore` (optimista + toast) contra
  `/api/v1/followers`.
- Reutilizar `album-card` y `track-table`; no crear variantes.
