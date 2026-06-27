---
name: Euphony
description: Dashboard de streaming musical dark premium — turquesa sobre negro puro.
colors:
  background: "#000000"
  foreground: "#FFFFFF"
  primary: "#00E6D0"
  primary-glow: "#26FFE9"
  primary-foreground: "#000000"
  surface-1: "#050707"
  surface-2: "#171B1C"
  surface-3: "#1F2424"
  surface-player: "#151818"
  divider: "#202525"
  soft: "#A0A0A0"
  dim: "#5F6668"
  destructive: "#EF4444"
  dot-red: "#FF2E51"
  dot-green: "#00D66B"
  dot-yellow: "#EACF34"
  dot-purple: "#8B41FB"
  cover-yellow: "#EDE135"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Inter, system-ui, sans-serif"
    fontSize: "clamp(56px, 7.5vw, 96px)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
    fontFeature: "'cv11', 'ss01'"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
    fontFeature: "'cv11', 'ss01'"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.18em"
    fontFeature: "'cv11', 'ss01'"
rounded:
  xs: "4px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.title}"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-glow}"
    textColor: "{colors.primary-foreground}"
  button-secondary:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "10px 20px"
  icon-button-play:
    backgroundColor: "{colors.foreground}"
    textColor: "{colors.background}"
    rounded: "{rounded.full}"
    height: "40px"
    width: "40px"
  chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "8px 20px"
  chip-unselected:
    backgroundColor: "{colors.background}"
    textColor: "{colors.soft}"
    rounded: "{rounded.full}"
    padding: "8px 20px"
  input-search:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    height: "56px"
    padding: "0 20px 0 56px"
  card-album:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "16px"
  nav-item:
    textColor: "{colors.soft}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
---

# Design System: Euphony

## 1. Overview

**Creative North Star: "La sala de escucha a medianoche"**

Euphony es una habitación a oscuras donde lo único que importa es el sonido. El fondo es **negro
puro (#000000)** — no un gris oscuro, no un azul de medianoche: negro de verdad, la sala apagada.
Sobre él, el contenido flota en **superficies en capas** apenas más claras (el sofá, la mesa, el
estante), y un único punto de luz —el **turquesa #00E6D0**— marca lo que está vivo: lo que suena,
lo que puedes tocar, dónde está tu foco. La jerarquía no se construye con bordes ni con cajas, se
construye con luz y con tipografía. La interfaz no compite con la música; se aparta para que las
portadas y los artistas sean lo que brilla.

El sistema es **premium, sereno y nítido**. Premium por la restricción: un solo acento, sombras casi
ausentes, nada de cromo. Sereno por el ritmo: espacio negativo generoso, movimiento contenido
(150–300ms), ninguna animación que desplace el layout. Nítido por el contraste: blanco puro sobre
negro puro para lo que importa, y una escala de grises disciplinada para todo lo demás. Como pieza de
portfolio, cada pantalla se trata como final: el detalle es el entregable.

Euphony **rechaza** explícitamente tres cosas. No es un **clon de Spotify**: nada de verde ni de un
layout calcado; su identidad (turquesa sobre negro) es propia y deliberada. No es **neón recargado ni
glassmorphism**: el glow turquesa es puntual (el CTA principal), nunca ambiente; sin blur decorativo.
Y no es **recargado ni abarrotado**: el espacio negativo es parte del diseño; la música respira. Si
una pantalla empieza a parecerse a un dashboard SaaS genérico —grids de cards idénticas, eyebrows en
mayúscula sobre cada sección, métricas con gradiente— algo se ha roto.

**Key Characteristics:**
- Negro puro como lienzo; profundidad por capas tonales, no por bordes.
- Un único acento turquesa, usado con avaricia para lo accionable y lo activo.
- Tipografía como estructura: titulares contundentes, cuerpo discreto.
- Movimiento contenido, con propósito; nunca decorativo.
- Lujo silencioso: quitar antes que añadir.

## 2. Colors

Una paleta monocroma de grises sobre negro, perforada por un solo turquesa eléctrico y un puñado de
puntos semánticos funcionales.

### Primary
- **Turquesa Euphony** (#00E6D0 · `hsl(174 100% 45%)`): el único acento de marca. Reservado para lo
  accionable y lo activo: CTA primario, estado activo/seleccionado, anillo de foco, progreso de
  reproducción, título de la pista que suena. Su rareza es lo que lo hace legible.
- **Turquesa brillante** (#26FFE9 · `hsl(174 100% 55%)`): solo para el `:hover` del CTA primario.
  No usar como color de reposo.
- **Tinta sobre acento** (#000000): texto e iconos *encima* del turquesa. Negro, nunca blanco —
  el turquesa es claro y exige tinta oscura para llegar a contraste.

### Neutral
- **Negro puro** (#000000 · `hsl(0 0% 0%)`): el fondo global. La sala apagada.
- **Blanco puro** (#FFFFFF · `hsl(0 0% 100%)`): títulos y texto fuerte. También el fondo del
  botón de play principal (el único elemento blanco sólido del sistema).
- **Superficie 1** (#050707 · `hsl(187 18% 4%)`): sidebar y fondos de card tenues (a menudo al
  40%, `surface-1/40`). El primer escalón sobre el negro.
- **Superficie 2** (#171B1C · `hsl(190 8% 10%)`): cards, inputs, popovers, hover de card. La capa
  de trabajo.
- **Superficie 3** (#1F2424 · `hsl(180 7% 14%)`): hover sobre superficie 2, tracks de slider,
  estados activos sutiles.
- **Superficie player** (#151818 · `hsl(180 7% 9%)`): fondo dedicado de la barra de reproducción.
- **Divisor** (#202525 · `hsl(180 11% 14%)`): bordes y separadores. Hilos finos, nunca paredes.
- **Gris suave** (#A0A0A0 · `hsl(0 0% 63%)`): texto secundario — artista, metadatos, subtítulos.
  El gris de cuerpo por defecto para lo no-primario.
- **Gris tenue** (#5F6668 · `hsl(195 5% 39%)`): labels de sección en mayúscula, captions,
  placeholders, iconos decorativos. **Solo texto grande o en mayúscula** (ver Named Rules).

### Tertiary (puntos semánticos funcionales — no son acentos de marca)
- **Puntos de playlist y portada** (#FF2E51 rojo · #00D66B verde · #EACF34 amarillo · #8B41FB morado
  · #EDE135 cover-yellow): exclusivamente como marcadores funcionales (categoría de playlist, color
  de portada generada). El verde dobla como indicador de "favorito" en la barra de reproducción.
  **Nunca** ascienden a acento de interfaz; el único acento es el turquesa.

### Named Rules
**The One Turquoise Rule.** Hay un solo color de acento: el turquesa #00E6D0. No se introduce un
segundo. Si algo necesita destacar y no es accionable ni activo, se resuelve con peso tipográfico,
tamaño o espacio — no con color. El acento vive en ≤10% de cualquier pantalla; su escasez es el
diseño.

**The Tinta-Oscura-Sobre-Acento Rule.** Todo texto o icono sobre el turquesa es negro (#000000).
Blanco sobre turquesa está prohibido: no llega a contraste.

**The Gris-Tenue Rule.** `#5F6668` ronda 3.5:1 sobre negro: reprueba 4.5:1. Permitido solo en texto
grande, labels en mayúscula o decoración. Para texto secundario de cuerpo, siempre `#A0A0A0`.

## 3. Typography

**Display Font:** Bricolage Grotesque (fallback Inter → system-ui → sans-serif)
**Body / Title / Label Font:** Inter (400–900, fallback system-ui → sans-serif)

**Character:** Una sola familia humanista (Inter) carga toda la UI —títulos, botones, labels, cuerpo,
datos—, afinada con `font-feature-settings: 'cv11', 'ss01'` para una "1" recta y alternativas
limpias. La display (Bricolage Grotesque) entra **solo** en los titulares de mayor escala
(`.display-title`, hero, now-playing) para dar contundencia sin abandonar el registro nítido.
⚠️ **Estado actual:** Bricolage Grotesque está declarada (`font-display`, `.display-title`) pero **no
se carga** en `index.html`, así que hoy cae a Inter 800. Hay que cablear la fuente para que la
identidad tipográfica esté completa (ver Do's and Don'ts).

### Hierarchy
- **Display** (800, `clamp(56px, 7.5vw, 96px)`, line-height 0.95, tracking −0.04em, `text-wrap: balance`):
  `.display-title` — hero y now-playing. El único punto donde la tipografía grita, y lo hace en voz baja.
- **Title** (600, 14–15px, line-height ~1.3): títulos de card, tabs, nav. La columna vertebral de la
  jerarquía de UI.
- **Body** (400–500, 14–15px, line-height ~1.5): texto general. Nunca por debajo de 14px en desktop;
  16px mínimo para inputs en móvil. Prosa larga capada a 65–75ch.
- **Label** (600, 11–13px, `uppercase`, tracking 0.18–0.2em, color `dim`): labels de sección y
  captions. Números siempre con `tabular-nums`.

### Named Rules
**The Display-Solo-en-Hero Rule.** La fuente display vive únicamente en `.display-title`, hero y
now-playing. En labels, botones, datos o tablas está **prohibida**: ahí manda Inter. Las fuentes
display en la UI funcional son ruido.

**The Single-Family Rule.** Inter en múltiples pesos resuelve toda la UI. No se empareja con una
segunda sans similar; el contraste tipográfico se logra con peso y escala, no con una segunda familia.

## 4. Elevation

El sistema es **plano por defecto, con profundidad tonal**. La jerarquía de capas no se construye con
sombras sino subiendo un escalón de superficie sobre el negro (`surface-1` → `surface-2` →
`surface-3`). Las sombras son la excepción, no la regla, y solo existen en dos formas: el **glow
turquesa** del CTA primario (la única sombra de color permitida) y una **sombra negra difusa** bajo
covers grandes para despegarlos del fondo. Sin sombras de color que no sean el glow; sin elevación
decorativa.

### Shadow Vocabulary
- **Glow turquesa** (`box-shadow: 0 0 32px hsl(var(--primary) / 0.45)`): solo en el CTA primario y
  énfasis "en directo". Es luz, no profundidad.
- **Sombra de cover** (`box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.6)` → `shadow-2xl shadow-black/60`):
  bajo portadas grandes (now-playing, detalle de álbum). Negra y difusa, nunca de color.
- **Foco** (`outline: 2px solid hsl(var(--ring)); outline-offset: 2px`): anillo turquesa de teclado
  vía `:focus-visible`. Cuenta como elevación de estado, no decorativa.

### Named Rules
**The Glow-Only Rule.** La única sombra de color del sistema es el glow turquesa. Cualquier otra
sombra es negra y difusa, o no existe. Sombras duras o de colores arbitrarios están prohibidas.

**The Flat-Until-State Rule.** Las superficies son planas en reposo. La profundidad aparece como
respuesta a un estado (hover sube de superficie, foco dibuja el anillo), no como decoración de base.

## 5. Components

Todos los componentes interactivos definen sus estados: default, hover, focus (`:focus-visible`
turquesa), y donde aplique active/selected/disabled. La transición estándar es
`all 0.25s cubic-bezier(0.4, 0, 0.2, 1)` y solo anima `transform`/`opacity`/`color` — nunca
`width`/`height`/`top`.

### Buttons
- **Shape:** píldora completa (`border-radius: 9999px`) para CTAs y controles; los icon-buttons de
  control también son circulares.
- **Primary:** fondo turquesa (#00E6D0), tinta negra, `padding: 10px 20px`, `shadow-glow`. Hover →
  turquesa brillante (#26FFE9). El único botón con glow.
- **Secondary:** fondo negro, texto blanco, borde 1px divisor (#202525). Hover → el borde vira a
  turquesa. Sin relleno, sin glow.
- **Soft (texto):** sin fondo, `color: soft` (#A0A0A0). Hover → blanco. Para acciones terciarias.
- **Icon-button de play:** círculo blanco sólido de 40×40px, icono negro. Hover → `scale(1.05)`.
  El único elemento blanco sólido del sistema; su contundencia marca la acción principal.

### Chips
- **Style:** píldora con borde 1px, `padding: 8px 20px`, texto 13px/500.
- **State:** seleccionado → relleno turquesa + tinta negra (`border-primary bg-primary`); sin
  seleccionar → borde divisor + texto suave, hover sube borde y texto a turquesa/blanco. Usados como
  filtro de géneros reales.

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px) en cards de catálogo; `rounded-2xl` (16px) en heros/promos;
  `rounded-lg` (12px) en imágenes internas.
- **Background:** `surface-1/40` en reposo, sube a `surface-2` sólido en hover. Sin bordes: la card
  se define por su superficie, no por un contorno.
- **Shadow Strategy:** ninguna en cards (ver Elevation). Solo covers grandes llevan sombra negra.
- **Internal Padding:** 16px (`p-4`).
- **Behavior:** la imagen escala a `scale(1.05)` en hover del grupo; el resto es cambio de superficie.
  Nada desplaza el layout.

### Inputs / Fields
- **Style:** fondo `surface-2`, alto 56px (`h-14`), `rounded-xl`, borde transparente, icono guía en
  `dim` a la izquierda, placeholder en `dim`.
- **Focus:** el borde vira a `primary/60` y aparece un anillo turquesa muy tenue
  (`box-shadow: 0 0 0 4px hsl(var(--primary) / 0.08)`). Foco como susurro, no como neón.

### Navigation
- **Sidebar (desktop):** 240px, `hidden lg:flex`. Items: icono + label 15px/500, `text-soft` en
  reposo, hover → blanco, activo → turquesa (`routerLinkActive`). `rounded-md`, `padding: 10px 12px`.
- **Mobile:** ⚠️ hoy **no hay navegación en móvil** (la sidebar se oculta bajo `lg`). Pendiente: una
  bottom-bar. Es un hueco a cerrar para el objetivo "premium en cualquier dispositivo".

### Track table (componente de firma)
Grid de columnas (`#`, título, álbum, fecha, duración, acciones). Hover sube la fila a `surface-2/60`;
la fila activa fija `surface-2` y tiñe el título de turquesa. El `#` se intercambia por un botón de
play en hover; corazón y "más" aparecen con `opacity-0 group-hover:opacity-100`. La densidad es alta a
propósito: aquí el usuario está en tarea.

## 6. Do's and Don'ts

### Do:
- **Do** usar siempre tokens (`bg-surface-2`, `text-soft`, `text-primary`), nunca hex crudos en plantillas.
- **Do** tratar el turquesa como recurso escaso: solo accionable y activo, ≤10% de la pantalla.
- **Do** construir profundidad subiendo de superficie (`surface-1` → `2` → `3`), no con bordes ni sombras.
- **Do** poner tinta **negra** sobre cualquier fondo turquesa.
- **Do** usar `#A0A0A0` (soft) para texto secundario; reservar `#5F6668` (dim) a texto grande o mayúsculas.
- **Do** iconos lucide registrados, con `aria-label` en los solo-icono.
- **Do** respetar `prefers-reduced-motion` (ya implementado en `styles.css`) y mostrar foco turquesa visible.
- **Do** comunicar el estado también por forma, icono, peso o posición — nunca solo por color.
- **Do** cargar Bricolage Grotesque antes de confiar en `.display-title` (hoy cae a Inter).

### Don't:
- **Don't** parecer un **clon de Spotify**: ni verde, ni layout calcado. La identidad turquesa-sobre-negro es propia.
- **Don't** caer en **neón recargado ni glassmorphism**: el glow es puntual, no ambiente; sin blur decorativo.
- **Don't** **recargar ni abarrotar**: respeta el espacio negativo; deja respirar la música.
- **Don't** parecer un **dashboard SaaS genérico**: nada de grids de cards idénticas, eyebrows en
  mayúscula sobre cada sección, ni métricas con gradiente.
- **Don't** introducir un segundo color de acento (rompe The One Turquoise Rule).
- **Don't** usar sombras de color que no sean el glow turquesa, ni sombras duras.
- **Don't** usar la fuente display en labels, botones, datos o tablas.
- **Don't** usar `#5F6668` como texto de cuerpo (≈3.5:1, reprueba contraste).
- **Don't** animar `width`/`height`/`top` ni provocar layout shift en hover.
- **Don't** dejar `text-clip` con gradiente, side-stripes de color ni emojis como iconos.
