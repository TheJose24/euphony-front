# Página: Home (`/home`) — overrides

> Delta sobre [MASTER](../MASTER.md). El home es un **dashboard de descubrimiento**, no una vista
> de detalle. Componente: [home.ts](../../src/app/features/home/home.ts) /
> [home.html](../../src/app/features/home/home.html).

## Layout
Envuelto en `<app-layout [(query)]>` (shell global: sidebar + search-bar + slot derecho + player-bar).
Contenedor: `px-6 md:px-10 py-8 space-y-10 animate-fade-in`. Secciones, de arriba a abajo:

1. **Hero banners** (`<app-hero-banners>`) — carrusel promocional horizontal `snap-x`. ⚠️ Datos
   hardcoded ([home.data.ts](../../src/app/core/data/home.data.ts)).
2. **Category chips** — solo visible en el tab `Playlist`. Label de sección
   `text-[13px] font-bold uppercase tracking-[0.18em]`. Chips = **géneros reales** del backend; filtran.
3. **Content tabs** (`Playlist | Artists | Albums | Streams | Favorites`) + contenido según tab:
   - `Playlist` / `Streams` / `Favorites` → `<app-track-table>` (Streams = ordenado por reproducciones).
   - `Artists` / `Albums` → grid `grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5`.
4. **Popular artists** (`<app-popular-artists>`) — scroll horizontal. ⚠️ Datos hardcoded.
5. **Right panel** (`appRight`) — favoritos + promo premium; `hidden xl:flex`.

## Estado real vs visual
- **Real (backend):** track-table (Playlist/Streams), géneros (chips), Artists, Albums, Favorites (likes por usuario).
- **Visual/hardcoded:** hero-banners, popular-artists, playlists del sidebar.

## Notas
- ✅ (P0) Estados unificados: usa `<app-loading-state>` / `<app-empty-state>` / `<app-error-state>`
  (con "Reintentar" → `loadSongs/loadArtists/loadAlbums/loadFavorites`). Los likes muestran toast de
  error si falla la llamada. Ya no hay divs de texto ad-hoc ni `text-red-400` crudo.
