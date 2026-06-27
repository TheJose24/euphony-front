# Player — player-bar (persistente) + `/player` (full-screen) — overrides

> Delta sobre [MASTER](../MASTER.md). Estado global en
> [player.store.ts](../../src/app/core/state/player.store.ts) (signals + `HTMLAudioElement` real).

## Player-bar (persistente, abajo)
[player-bar.html](../../src/app/layout/player-bar/player-bar.html). `sticky bottom-0 z-30 h-[112px]`,
3 columnas:
- **Izq (`w-[280px]`):** cover `h-16 w-16 rounded-md` + título (`14px/600`) + artista (`text-soft`)
  + corazón (favorito → `text-dot-green` / `fill-dot-green`).
- **Centro (`flex-1`):** controles `shuffle · skip-back · play/pause · skip-forward · repeat`.
  Play = botón `h-10 w-10 rounded-full bg-white text-black hover:scale-105`. Debajo, barra de
  progreso `h-1 bg-surface-3`, relleno `bg-foreground group-hover:bg-primary`, tiempos `tabular-nums`.
- **Der (`w-[200px]`, `hidden md:flex`):** cola, dispositivos, volumen.

## Estado (✅ P1 hecho)
- **Cola real** en [player.store.ts](../../src/app/core/state/player.store.ts): `setQueue(tracks, i)`,
  `current` = `queue[index]`, `next()/previous()/jumpTo()`, `shuffle`, `repeat` (off/all/one) y
  **auto-next** al terminar (evento `ended`). `setTrack` es ahora azúcar para una cola de 1.
- `shuffle`, `skip-back`, `skip-forward`, `repeat` del player-bar **ya están cableados** (antes
  decorativos); `skip-forward` se deshabilita si no hay siguiente (`hasNext()`).
- **Favoritos unificados**: el corazón usa `FavoritesStore` (consume el backend), igual que las
  tablas y la tab "Favorites" → estado sincronizado y persistente. El `PlayerStore` ya no guarda likes.
- ✅ (P0) Fondo del player-bar con `bg-surface-player` + `z-player`.

## `/player` full-screen
[player.ts](../../src/app/features/player/player.ts) — **rediseñado** (ya no es el mockup peach):
- Layout `lg:grid-cols-[1.4fr_1fr]`: izquierda **now-playing** (cover grande, título `font-display`,
  artista/álbum, barra de progreso con seek, controles, botón de favorito); derecha **"A continuación"**
  (lista `player.upNext()`, click → `jumpTo`). Fondo `bg-gradient-to-b from-surface-2 to-background`.
- Quién entra/sale de la cola lo deciden home (lista de la tab activa), album-detail y artist-detail
  vía `setQueue`.
