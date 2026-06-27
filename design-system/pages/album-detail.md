# Página: Album detail (`/album/:id`) — overrides

> Delta sobre [MASTER](../MASTER.md). Componente:
> [album-detail.ts](../../src/app/features/album-detail/album-detail.ts).

## Layout
Dentro de `<app-layout>`. Patrón **header de detalle + lista de canciones**:

1. **Header de álbum** (estilo `playlist-header`): cover grande `~260–300px rounded-xl shadow-2xl
   shadow-black/60`, título con `.display-title`/`font-display`, artista + año + nº de canciones,
   botón **Play all** (`h-16 w-16 rounded-full bg-primary shadow-glow`), favorito, descargar, más.
2. **Track table** (`<app-track-table>`, `showHeader` activado) con las canciones del álbum.

## Datos
- **Real:** álbum por id + `GET /api/v1/songs/search/by-album/{albumId}` (DTO enriquecido con
  `artistName`, `albumTitle`, `albumCover`, `genres`).
- Selección de fila → `PlayerStore.setTrack()`. Cuando exista cola (P1), Play-all debe **encolar todo**
  el álbum como contexto.

## Notas
- Reutilizar el componente `playlist-header` (hoy reservado para vistas de detalle) y `track-table`.
- ✅ (P2) Botón de **favorito de álbum** en el header (junto a "Reproducir"), cableado al
  `AlbumFavoritesStore` (optimista + toast). El `album-card` también lleva su corazón y el
  `right-panel` "Favorite Album" es reactivo al mismo store.
