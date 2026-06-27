# Página: Buscar (`/search`) — overrides

> Delta sobre [MASTER](../MASTER.md). Búsqueda dedicada con **resultados mixtos**. Componente:
> [search.ts](../../src/app/features/search/search.ts).

## Por qué client-side
El backend solo busca por **nombre exacto** (resultado único) de artista/álbum y **no** tiene
búsqueda de texto de canciones. Por eso esta página carga el catálogo (`/songs/all`,
`/artists/all`, `/albums/all`) una vez y **filtra en cliente** por la query del buscador superior —
más capaz que los endpoints de búsqueda del backend para los tamaños de datos actuales.

## Layout (dentro de `<app-layout [(query)]>`)
Estados, en orden:
- **loading** → `<app-loading-state>` · **error** → `<app-error-state>` (retry → `load()`).
- **Sin query** → bloque-prompt centrado (icono `search`, "Busca en Euphony", enlace **Explorar el
  catálogo** → `/browse`).
- **Query sin resultados** → `<app-empty-state>` ("Sin resultados para «…»").
- **Con resultados** → secciones (solo las que tienen match), cada una con label de sección
  (`uppercase tracking-[0.18em]`):
  - **Canciones** → `<app-track-table>` (encola los resultados al reproducir; like sincronizado).
  - **Artistas** → grid de `<app-artist-card>`.
  - **Álbumes** → grid de `<app-album-card>`.

## Navegación
- Entrada principal: sidebar **Search** y `bottom-nav` **Buscar** → `/search`.
- `/browse` (catálogo Explorar) es secundaria: se alcanza desde el prompt de búsqueda y por enlace.

## Notas
- Reutiliza `track-table`, `artist-card`, `album-card` y los estados — sin componentes nuevos.
- Si el backend añade búsqueda de texto de canciones, se puede migrar a server-side sin cambiar la UI.