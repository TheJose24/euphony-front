# Euphony — Design System (MASTER)

> **Fuente de verdad de diseño.** Cualquier agente IA o persona que cree/modifique UI en
> este repo debe seguir este documento. Para deltas concretos de una página, mira primero
> `design-system/pages/<página>.md`; si no existe, rige **solo** este MASTER.
>
> Este archivo está extraído del código real ([src/styles.css](../src/styles.css),
> [tailwind.config.js](../tailwind.config.js), componentes). Si tocas tokens en el código,
> **actualiza también este documento**.

---

## 1. Filosofía visual

Euphony es un **dashboard de streaming musical dark premium**. Principios:

- **Dark-first, negro puro.** Fondo `#000`, jerarquía construida con **superficies en capas**
  (no con bordes pesados). El contenido flota sobre el negro.
- **Una sola marca de acento: turquesa `#00E6D0`.** Se usa con moderación para lo accionable
  y lo activo (CTA, estado activo, foco, progreso). No introducir nuevos colores de acento.
- **Glow sutil, no neón.** El acento puede brillar (`shadow-glow`) en CTAs principales; el resto
  es plano y limpio.
- **Tipografía como estructura.** Títulos grandes y contundentes; cuerpo discreto y legible.
- **Movimiento contenido.** Transiciones de 150–300ms, hover suave (color/opacidad/escala leve),
  nunca animaciones que desplacen el layout.

Anti-patrones a evitar: segundo color de acento, fondos claros, bordes gruesos, sombras duras de
color, emojis como iconos, hex crudos en las clases.

---

## 2. Color tokens

Definidos como variables HSL en [src/styles.css](../src/styles.css) (`:root`) y expuestos como
utilidades Tailwind en [tailwind.config.js](../tailwind.config.js). **Usa siempre el token, nunca el hex.**

| Rol | Token Tailwind | HSL (`--var`) | Hex aprox | Uso |
|-----|----------------|---------------|-----------|-----|
| Fondo app | `bg-background` | `0 0% 0%` | `#000000` | Fondo global |
| Texto principal | `text-foreground` | `0 0% 100%` | `#FFFFFF` | Títulos, texto fuerte |
| **Acento marca** | `bg-primary` / `text-primary` | `174 100% 45%` | `#00E6D0` | CTA, activo, foco, progreso |
| Acento brillante | `bg-primary-glow` | `174 100% 55%` | `#26FFE9` | Hover de CTA primario |
| Texto sobre acento | `text-primary-foreground` | `0 0% 0%` | `#000000` | Texto encima de `bg-primary` |
| Superficie 1 | `bg-surface-1` | `187 18% 4%` | `#050707` | Sidebar, fondos de card tenues (`/40`) |
| Superficie 2 | `bg-surface-2` | `190 8% 10%` | `#171B1C` | Cards, inputs, popovers, hover de card |
| Superficie 3 | `bg-surface-3` | `180 7% 14%` | `#1F2424` | Hover/tracks de slider, estados activos sutiles |
| Superficie player | `bg-surface-player` | `180 7% 9%` | `#151818` | Fondo de la barra de reproducción |
| Divisor | `border-divider` | `180 11% 14%` | `#202525` | Bordes y separadores |
| Texto secundario | `text-soft` | `0 0% 63%` | `#A0A0A0` | Subtítulos, artista, metadatos |
| Texto terciario | `text-dim` | `195 5% 39%` | `#5F6668` | Labels de sección, captions ⚠️ ver a11y |
| Destructivo | `text-destructive` / `bg-destructive` | `0 84% 60%` | `#EF4444` | Errores, acciones peligrosas |
| Ring de foco | `ring-ring` | `174 100% 45%` | `#00E6D0` | Anillo de foco accesible |

**Colores semánticos puntuales** (puntos de playlist y portadas):
`dot-red 350 100% 59%`, `dot-green 150 100% 42%` (también usado como "favorito" en el player-bar),
`dot-yellow 51 81% 56%`, `dot-purple 264 96% 62%`, `cover-yellow 56 84% 57%`.

**Excepciones de color permitidas y documentadas:** los azules de marca OAuth
(Apple `#000`, Facebook `#1877F2`) en el login. Cualquier otro hex crudo es deuda a tokenizar.

### Cómo añadir un color nuevo (si fuera imprescindible)
1. Define la variable HSL en `:root` de [src/styles.css](../src/styles.css).
2. Mapéala en `theme.extend.colors` de [tailwind.config.js](../tailwind.config.js) como `hsl(var(--x))`.
3. Documéntala en la tabla de arriba. Nunca uses `bg-[#hex]` en plantillas.

---

## 3. Tipografía

- **UI / body: `Inter`** (pesos 400–900), cargada por `<link>` en [src/index.html](../src/index.html).
  Fallback `system-ui, sans-serif`. `font-feature-settings: 'cv11', 'ss01'`.
- **Display (titulares grandes): `Bricolage Grotesque`** — fuente **variable** (eje `opsz 12–96`,
  pesos 400–800), cargada en [src/index.html](../src/index.html) vía Google Fonts. Token Tailwind
  **`font-display`**. Úsala **solo** para titulares grandes: `.display-title` (ya la aplica, con
  `font-optical-sizing: auto` → letterforms ópticas a gran tamaño), hero del player y `h1` de las
  páginas de detalle (`font-display text-4xl md:text-5xl`). El resto de la UI sigue en Inter.
- **Stacks tokenizados (única fuente de verdad):** `--font-sans` y `--font-display` en `:root` de
  [src/styles.css](../src/styles.css); `tailwind.config.js` (`fontFamily.sans`/`display`) los
  referencia con `var(--…)`. Cambia la familia en **un solo sitio**.

### Escala tipográfica (la que usa el código hoy)

| Rol | Tamaño / peso | Notas |
|-----|---------------|-------|
| Display title | `clamp(3.5rem, 7.5vw, 6rem)` / 800 | `.display-title` (`font-display`), en **rem** (respeta el zoom), 56→96px. `letter-spacing -0.04em`, `line-height 0.95`, `text-wrap: balance`, `font-optical-sizing: auto`. Techo 6rem |
| Label de sección | `11–13px` / 600 | `uppercase`, `tracking 0.18–0.2em`, `text-dim` |
| Tab | `15px` / 600 | Navegación de tabs |
| Título de card | `14px` / 600 | `truncate`, `text-foreground` |
| Body | `14–15px` / 400–500 | Texto general |
| Caption / metadatos | `12–13px` / 400 | `text-soft`; números con `tabular-nums` |

Regla: el cuerpo nunca por debajo de 14px en desktop; mínimo 16px para inputs en móvil.

---

## 4. Iconografía

- **Librería: `lucide-angular`** (única fuente de iconos). **Nunca emojis ni otros sets.**
- Registro central en [src/app/shared/icons/lucide-icons.ts](../src/app/shared/icons/lucide-icons.ts).
  Para usar un icono nuevo: impórtalo ahí y añádelo al `LucideAngularModule.pick({...})`.
- Patrón de uso (referencia por nombre kebab-case):
  ```html
  <lucide-icon name="skip-back" class="h-5 w-5" [strokeWidth]="1.75"></lucide-icon>
  ```
- **Tamaños canónicos:** `h-4 w-4` (16px, filas de tabla/metadatos), `h-[18px] w-[18px]`
  (nav y controles secundarios del player), `h-5 w-5` (controles), `h-6/7` (play principal),
  `h-12 w-12` (placeholder de cover vacío).
- Iconos rellenos: usar `fill-current` / `fill-primary` para estados activos (play, corazón).
- Iconos solo-icono **deben** llevar `aria-label`. Decorativos llevan `aria-hidden="true"`.
- Iconos ya registrados: home, search, settings, play, pause, shuffle, skip-back, skip-forward,
  repeat, heart, disc-3, list-music, headphones, music-2, radio, mic-2, users, badge-check,
  download, more-horizontal, chevron-right, plus, crown, monitor-speaker, volume-2, clock,
  trending-up, flame, apple, facebook, circle-check, info, triangle-alert, x.

---

## 5. Espaciado, radios, sombras, z-index

- **Espaciado:** escala base 4px de Tailwind. `gap`/`p` habituales: 2, 3, 4, 5, 6, 8. Padding de
  contenido `px-6 md:px-10 py-8`. No inventar gaps arbitrarios.
- **Radios:** base `--radius: 0.75rem`. `rounded-sm/md/lg` derivan de él; además `rounded-xl`
  (cards), `rounded-2xl` (heros/promos), `rounded-full` (avatares, botones de control).
- **Sombras:** `shadow-glow` (glow turquesa para CTA primario), `shadow-2xl shadow-black/60`
  (covers grandes). Evitar sombras de color que no sean el glow.
- **z-index** (tokens semánticos en [tailwind.config.js](../tailwind.config.js)): contenido 0 →
  `z-dropdown` (20, menús/popovers) → `z-player` (30, barra de reproducción) → `z-modal` (50,
  modales/overlays/toasts). Usa estos tokens, no números sueltos.
- **Transición estándar:** `transition-base` = `all 0.25s cubic-bezier(0.4,0,0.2,1)`.

---

## 6. Patrones de componente (snippets canónicos)

Reutiliza estos patrones; no inventes variantes nuevas sin razón.

**Card de catálogo (álbum)** — [album-card.html](../src/app/features/browse/components/album-card/album-card.html):
```html
<a [routerLink]="['/album', id]"
   class="group flex flex-col gap-3 rounded-xl bg-surface-1/40 p-4 transition-base hover:bg-surface-2">
  <div class="relative aspect-square w-full overflow-hidden rounded-lg bg-surface-2">
    <img [src]="cover" [alt]="title" loading="lazy"
         class="h-full w-full object-cover transition-base group-hover:scale-105" />
    <!-- fallback: <lucide-icon name="disc-3" class="h-12 w-12 text-dim"> centrado -->
  </div>
  <div class="min-w-0">
    <div class="truncate text-[14px] font-semibold text-foreground">{{ title }}</div>
    <div class="truncate text-[12px] text-soft">{{ subtitle }}</div>
  </div>
</a>
```

**Card de artista (circular + verificado)** — [artist-card.html](../src/app/features/browse/components/artist-card/artist-card.html):
avatar `h-24 w-24 rounded-full ... ring-1 ring-divider group-hover:ring-primary`; fallback con la
inicial en `text-primary`; badge `badge-check` absoluto abajo-derecha.

**Botón primario (CTA):**
```html
<button class="rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground
               shadow-glow transition-base hover:bg-primary-glow">…</button>
```
**Botón secundario:** `border border-divider bg-background text-foreground hover:border-primary`.
**Botón soft (texto):** `text-soft transition-base hover:text-foreground`.
**Icon-button de control:** `flex h-10 w-10 items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-base` (play); secundarios = soft.

**Fila de tabla de canciones** — referencia completa en
[track-table.html](../src/app/features/home/components/track-table/track-table.html):
grid `grid-cols-[40px_minmax(0,2.2fr)_minmax(0,1.5fr)_minmax(0,1fr)_80px_80px]`, hover
`hover:bg-surface-2/60`, fila activa `bg-surface-2` + título `text-primary`, # ↔ play en hover,
corazón/more aparecen con `opacity-0 group-hover:opacity-100`.

**Chips de filtro:** activo `border-primary bg-primary text-primary-foreground`;
inactivo `border-divider text-soft hover:border-primary`.

**Tabs:** fila con `border-b border-divider`; indicador activo = `span` de 3px `bg-primary`
redondeado abajo; texto activo `text-foreground`, inactivo `text-soft`.

**Menú/popover:** `rounded-lg border border-divider bg-surface-2 py-1.5 shadow-2xl animate-fade-in`,
items `hover:bg-surface-3 hover:text-foreground`.

### Estados async y notificaciones (reutilizables — NO recrear ad-hoc)
Componentes en [src/app/shared/ui/](../src/app/shared/ui/). Úsalos en lugar de divs de texto sueltos:
- **`<app-loading-state [rows] [label] />`** — skeleton de filas (reserva espacio, evita layout shift).
- **`<app-empty-state [icon] [message] />`** — icono lucide + mensaje (estado vacío).
- **`<app-error-state [message] [showRetry] (retry) />`** — error con botón "Reintentar"; el padre
  expone un método de recarga (patrón: extraer la carga a `loadX()` y cablear `(retry)="loadX()"`).
- **Toasts:** inyecta `ToastService` y llama `toast.success/error/info(msg)`. El
  `<app-toast-container>` está montado una vez en el root (`app.ts`); apila arriba-derecha en
  `z-modal`. Usa toasts para feedback de acciones (p. ej. fallo al dar/quitar like).
- **`<app-modal [open] [title] (close)>`** — diálogo centrado reutilizable (overlay fijo `z-modal`,
  cierra con backdrop / Escape / botón). Contenido proyectado. Úsalo para formularios/pickers en vez
  de dropdowns dentro de contenedores con `overflow`.
- **"Añadir a playlist":** inyecta `PlaylistPickerService` y llama `picker.open(track)`; el
  `<app-playlist-picker>` (montado en el root) muestra el modal con las playlists del usuario.

---

## 7. Animación

- Keyframes disponibles ([tailwind.config.js](../tailwind.config.js)): `animate-fade-in`
  (entrada de menús/contenido), `animate-pulse-glow` (énfasis de "en directo"/grabando).
- Micro-interacciones 150–300ms con `transition-base`. Animar **solo** `transform`/`opacity`/`color`
  (nunca `width`/`height`/`top`).
- Hover de imagen: `group-hover:scale-105`. Hover de texto: cambio de color. Sin layout shift.
- **`prefers-reduced-motion: reduce` ya está respetado globalmente** en [src/styles.css](../src/styles.css)
  (colapsa animaciones/transiciones). No necesitas añadirlo por componente.

---

## 8. Responsive

Mobile-first. Breakpoints Tailwind (`sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1400`).
Patrón de **visibilidad progresiva**:

- Sidebar: `hidden lg:flex` (240px). En `<lg` se sustituye por **`<app-bottom-nav>`** (barra de
  pestañas inferior, `lg:hidden`) montada en el `app-layout` — la app es navegable en móvil.
- Right panel: `hidden xl:flex` (~290px).
- Columnas de tabla: Álbum `hidden md:block`, Fecha `hidden lg:block`.
- Player-bar extras (volumen/dispositivos): `hidden md:flex`.
- Padding adaptativo: `px-6 md:px-10`.

Validar siempre en **375 / 768 / 1024 / 1440 px**.

---

## 9. Accesibilidad (mínimos no negociables)

- Contraste texto normal ≥ 4.5:1. ⚠️ **`text-dim` (`#5F6668`) sobre negro ≈ 3.5:1**: úsalo solo
  para texto grande, labels en mayúscula o decorativo, **nunca** para body. Para secundario usa `text-soft`.
- `aria-label` obligatorio en botones solo-icono; `aria-hidden` en iconos decorativos.
- Foco visible: hay un anillo turquesa **global** vía `:focus-visible` en [src/styles.css](../src/styles.css)
  (solo en navegación por teclado). No lo desactives; Tab order = orden visual.
- `alt` descriptivo en imágenes con significado; `alt=""` en decorativas.
- El color no puede ser el único indicador de estado.
- Inputs con `label`/`for` o `aria-label`; tamaño táctil mínimo 44×44px.

---

## 10. Do / Don't

| ✅ Do | ❌ Don't |
|------|---------|
| Tokens (`bg-surface-2`, `text-soft`) | Hex crudos (`bg-[#151818]`) |
| Iconos lucide registrados | Emojis o SVG sueltos |
| Turquesa como único acento | Segundo color de acento |
| `cursor-pointer` en clicables | Cursor por defecto en cards interactivas |
| Hover por color/opacidad/escala leve | Hover que desplaza el layout |
| `transition-base` (150–300ms) | Cambios instantáneos o >500ms |
| Skeleton/empty/error reutilizables | Estados de carga ad-hoc por página |

### Checklist pre-entrega
- [ ] Sin emojis como iconos (lucide registrado).
- [ ] `cursor-pointer` + feedback de hover en todo lo clicable.
- [ ] Transiciones 150–300ms; `prefers-reduced-motion` respetado.
- [ ] Foco visible para teclado.
- [ ] Contraste ≥ 4.5:1 (cuidado con `text-dim`).
- [ ] Sin hex crudos (todo por token).
- [ ] Responsive 375/768/1024/1440 sin scroll horizontal.
- [ ] `aria-label`/`alt` presentes.
