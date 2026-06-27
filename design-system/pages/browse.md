# Página: Browse (`/browse`) — overrides

> Delta sobre [MASTER](../MASTER.md). Catálogo de descubrimiento: rejillas de artistas y álbumes.
> Componente: [browse.ts](../../src/app/features/browse/browse.ts).

## Layout
Dentro de `<app-layout>`. Mismo contenedor (`px-6 md:px-10 py-8`). Dos secciones con label de
sección (`uppercase tracking-[0.18em] text-foreground`):

- **Artists** → grid de `<app-artist-card>` (avatar circular, ver MASTER §6).
- **Albums** → grid de `<app-album-card>` (cover cuadrado, ver MASTER §6).

Grid estándar: `grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5`.

## Datos
- **Real:** `/api/v1/artists/all` y `/api/v1/albums/all`.
- **Búsqueda:** filtro **client-side** por nombre/país (la query del shell). Backend tiene
  `search/by-name` / `search/{name}` sin usar → migrar a una página `/search` dedicada (roadmap P2).

## Notas
- Las cards ya son el patrón canónico; reutilizarlas en playlist-detail, library, search.
- Fallbacks: álbum sin cover → `disc-3`; artista sin imagen → inicial en `text-primary`.
- ✅ (P2) `album-card` lleva un **corazón** (arriba-derecha, aparece en hover) cableado al
  `AlbumFavoritesStore`; el estado se comparte con album-detail y el right-panel.
