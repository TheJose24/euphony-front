# Euphony — guía para agentes IA

Frontend de **Euphony**, una plataforma de **streaming de música**. Este archivo es el índice de
entrada: léelo antes de tocar el proyecto para no re-analizarlo desde cero.

## Qué es
Dashboard de streaming dark premium (turquesa sobre negro). Reproducción de audio real, catálogo
(canciones/artistas/álbumes/géneros), likes y búsqueda. Estado de madurez y roadmap: ver
`docs_backend/` y el plan de mejoras del repo.

## Stack
- **Angular 21**, **standalone components** (sin NgModules).
- **Zoneless + signals**: `provideZonelessChangeDetection()` en
  [src/app/app.config.ts](src/app/app.config.ts); **no hay zone.js**. La vista se actualiza por
  signals/`computed` — si una respuesta async no refresca la UI, casi siempre es un signal mal usado.
- **Tailwind CSS 3.4** + tokens HSL en CSS vars. **lucide-angular** para iconos.
- **HTTP**: `provideHttpClient(withFetch(), withInterceptors([httpErrorInterceptor]))`.
- **Build**: `@angular/build` (esbuild). **pnpm 11**. SPA (sin SSR).

## Convenciones de arquitectura
- **Alias de import**: `@core/*`, `@shared/*`, `@layout/*`, `@features/*`, `@env/*`
  (definidos en [tsconfig.json](tsconfig.json)). Úsalos siempre.
- **Capas**:
  - `core/api/` → servicios HTTP + DTOs (`dto/`) + **mappers** (`*.mapper.ts`, DTO backend → modelo
    UI). Resuelve nombres en el mapper, no en la plantilla.
  - `core/state/` → **stores signal-based** singleton: `PlayerStore` (audio + playback + cola) y
    `AuthStore` (sesión, hoy mock). No hay NgRx.
  - `core/models/` → modelos de UI (`Track`, `ArtistTile`, `AlbumTile`).
  - `core/utils/format.ts` → `toSeconds()` / `fmtTime()`. Reutilízalos.
  - `layout/` → shell (app-layout, sidebar, search-bar, player-bar, user-avatar).
  - `features/` → páginas enrutadas (lazy `loadComponent`).
  - `shared/` → `ui/` reutilizable e `icons/lucide-icons.ts` (registro central de iconos).
- **Errores HTTP** ya normalizados por `core/api/http-error.interceptor.ts` → `ApiError`. No
  re-parsees errores en cada componente.
- **Media**: `core/api/media.ts` (`mediaUrl()`) resuelve rutas `/uploads/...`.

## Diseño de UI → usa el design system (NO improvises)
Antes de crear o modificar cualquier interfaz:
1. Lee **[design-system/MASTER.md](design-system/MASTER.md)** (tokens de color, tipografía,
   iconografía, espaciado, patrones de componente, animación, responsive, accesibilidad, do/don't).
2. Si trabajas en una página concreta, revisa **`design-system/pages/<página>.md`** (overrides);
   si no existe, rige solo el MASTER.
3. Regla de oro: **tokens, no hex crudos**; **lucide, no emojis**; turquesa como único acento.

## Backend / API → fuente de verdad
- **[docs_backend/API_ENDPOINTS.md](docs_backend/API_ENDPOINTS.md)**: contrato REST completo
  (`/api/v1`, DTOs, rutas no uniformes — respeta los sufijos exactos `/all`, `/search/...`).
- `docs_backend/PROMPT_*.md`: peticiones de cambio enviadas/por enviar al backend (CORS, imagen de
  artista, favoritos, etc.).
- **Dev**: `proxy.conf.json` proxya `/api` y `/uploads` (evita CORS). **Prod**: `environment.prod.ts`
  apunta a `apiUrl` absoluto.

## Comandos
- `pnpm start` — dev server con proxy.
- `pnpm build` — build de producción (respeta los budgets de [angular.json](angular.json)).
- `pnpm test` — vitest (hoy sin specs; empezar por mappers/utils/stores).

## Despliegue
Docker multi-stage (Node build → nginx SPA). nginx hace fallback SPA a `/index.html`.
⚠️ pnpm 11 da `ERR_PNPM_IGNORED_BUILDS`: se resuelve en el Dockerfile con
`--config.dangerouslyAllowAllBuilds=true` (**no** tocar `package.json`).

## Estado y deuda conocida (resumen)
- **Real**: audio (HTMLAudioElement + stream Range), **cola/next-prev/shuffle/repeat + auto-next**
  (`PlayerStore`), catálogo, **likes de canción** (`FavoritesStore`), **favoritos de álbum**
  (`AlbumFavoritesStore`), **follow de artistas** (`FollowStore` + `FollowersService`),
  **playlists CRUD + canciones** (`PlaylistsStore`/`PlaylistsService`: sidebar crear/borrar,
  detalle `/playlist/:id` con **editar** (modal: nombre/descr./pública/portada) y **quitar canción**
  desde el menú ⋯ de la tabla, "añadir a playlist" vía picker global), **biblioteca "Tu biblioteca"**
  (`/library`: tabs Canciones/Álbumes/Playlists/Artistas agregando los stores), **búsqueda dedicada**
  (`/search`: resultados mixtos client-side de canciones/artistas/álbumes), filtros, navegación móvil
  (`bottom-nav`). Stores de favoritos/follow/playlists: optimistas + toast.
- **Auth real** (JWT propio del backend, `/api/auth`): login/registro (`AuthStore` + `AuthService`),
  tokens persistidos en `localStorage`, `authInterceptor` añade `Authorization: Bearer` a `/api/v1/**`
  y refresca en 401 (`/refresh`), `authGuard`/`guestGuard` protegen las rutas, logout en `user-avatar`.
  El `userId` sale de `AuthStore` (ya no hardcoded); los stores por-usuario cargan/limpian vía `effect`
  según `userId`. Nota: la API `/api/v1/**` sigue `permitAll`, así que el flujo 401→refresh está latente.
- **Perfil de usuario** (`/profile`, `ProfileStore` + `UserProfileService`): ver identidad (nombre,
  username, email, roles) y editar datos (fecha nac., país, ciudad, teléfono, ruta de avatar). El avatar
  del shell (`user-avatar`) sale del perfil; acceso vía menú del avatar. `404` = perfil aún sin crear →
  formulario vacío que el PUT crea/actualiza.
- **Mock/visual**: botones sociales del login (Facebook/Apple/Google), hero-banners, popular-artists.
- **Falta**: subida de imagen real para avatar/portada (hoy se guarda una ruta/URL; el backend de perfil
  no expone multipart); imágenes con `NgOptimizedImage` (pendiente de CDN); módulos planes/suscripciones
  (PayPal); más tests. Detalle en el plan.

## Design Context (contexto estratégico de diseño)
La estrategia de producto y diseño vive en **[PRODUCT.md](PRODUCT.md)** (raíz) — la leen las
herramientas de diseño (`/impeccable`). Resumen:
- **Register**: `product` (app/dashboard donde el diseño sirve a la tarea), enmarcado como pieza de
  **portfolio/demo**; objetivo central: **escucha inmersiva**. Personalidad: **premium, sereno, nítido**.
- **Principios**: (1) la música es la protagonista; (2) identidad propia, nunca clon de Spotify;
  (3) calma sobre densidad — lujo silencioso; (4) el detalle es el entregable; (5) accesible por diseño.
- **A11y**: objetivo WCAG 2.1 AA con foco extra en `prefers-reduced-motion` y en no depender solo del color.
- El **cómo se ve** (tokens, tipografía, componentes) está en `design-system/MASTER.md` y, en formato
  design.md para herramientas, en **[DESIGN.md](DESIGN.md)**.
