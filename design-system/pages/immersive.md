# Modo Inmersivo — `/immersive` (now-playing 3D reactivo) — overrides

> Delta sobre [MASTER](../MASTER.md). Feature nueva (ver `TASK/PROMPT_IMMERSIVE_MODE.md`).
> Estado de datos en [player.store.ts](../../src/app/core/state/player.store.ts).
> **Principio rector:** traducir técnicas inmersivas (3D, partículas, reactividad al audio) al
> registro de Euphony — **premium, sereno, calma sobre densidad**. NO es una pantalla "loud".

## Qué es

Vista de reproducción a **pantalla completa** (no usa `AppLayout`), con un `<canvas>` WebGL de fondo
que reacciona al audio real, y un overlay mínimo de información + transporte. Activable/desactivable
con niveles de intensidad. Inspiración de *técnicas* en Mineradio; estética 100% Euphony.

## Filosofía visual (delta)

- **Sereno, no espectáculo.** Movimiento lento y continuo; nada de sacudidas, flashes ni saturación.
  Si dudas entre "más vistoso" y "más calmado", elige calmado. Lujo silencioso.
- **El negro sigue mandando.** Fondo `bg-background` (`#000`); los visuales son luz sutil sobre negro,
  no un mural saturado. La portada y la luz turquesa son las protagonistas.
- **Un solo acento: turquesa.** Color base de glow/partículas = `--primary` `#00E6D0`. Se permite
  derivar un **acento secundario extraído de la portada actual** para teñir partículas, pero mezclado
  hacia el turquesa, nunca un arcoíris.
- **Glow sutil, no neón.** Bloom discreto. La intensidad la marca el audio, con techo bajo.

## Color (tokens, nunca hex crudo en UI)

- Fondo/overlay/texto: `bg-background`, `text-foreground`, `text-soft`, `text-dim` (solo labels).
- Acento visual y de UI: `primary` / `primary-glow`; foco `ring-ring`; glow `shadow-glow`.
- Para el **motor WebGL** (donde Tailwind no llega) lee los valores desde las CSS vars en runtime
  (`getComputedStyle(document.documentElement).getPropertyValue('--primary')`) y conviértelos — así el
  color del 3D queda atado al mismo token, no a un hex hardcodeado.
- Superficies del overlay glass: `bg-surface-2/60` + `backdrop-blur` + `border-divider`.

## Tipografía

- Título de la pista en el overlay: `font-display` (Bricolage Grotesque), `text-4xl md:text-5xl`.
- Artista/álbum/metadatos: Inter, `text-soft`. Tiempos con `tabular-nums`.
- Letra: Inter. Con `syncedLyrics` se renderiza **en la escena 3D** (CSS3D, ver sección abajo); la
  línea activa resaltada (`text-foreground`), las vecinas atenuadas (`text-soft`). Sin `syncedLyrics`,
  cae a un panel plano lateral. Resalte por color/opacidad, sin parpadeos; bajo `prefers-reduced-motion`
  los cambios de línea son instantáneos.

## Layout y overlay

- `fixed inset-0 z-modal bg-background` como contenedor; `<canvas>` detrás, overlay glass delante.
- Overlay mínimo: info de pista (abajo-izquierda o centrado), transporte (play/prev/next + seek),
  botón salir (`x`) arriba-derecha. **Auto-ocultar** el overlay tras ~3s de inactividad; reaparece con
  movimiento de ratón/tecla. `Esc` sale del modo.
- Controles reutilizan los patrones de botón del MASTER (play = `bg-white text-black rounded-full`;
  secundarios = soft). Seek = mismo patrón que el player-bar.

## Animación y movimiento

- Toda animación del overlay sigue el MASTER (150–300ms, solo `transform`/`opacity`/`color`).
- El **render WebGL** es continuo pero **lento**: deriva de cámara suave, rotación de partículas baja.
- **`prefers-reduced-motion` (no negociable):** el CSS global NO detiene un canvas WebGL, así que el
  motor DEBE comprobarlo con `matchMedia('(prefers-reduced-motion: reduce)')` y entonces: sin deriva de
  cámara, partículas casi quietas (o still), reacción al audio mínima o nula. Equivale a intensidad `subtle` forzada.
- **Intensidad** (`off` / `subtle` / `full`) controla densidad de partículas, amplitud de movimiento y
  fuerza del bloom. `off` = no montar el motor.

## Estante 3D (Fase 2)

**Lista vertical** de tarjetas (portada + **etiqueta 3D** con el título debajo) por el **lado derecho**
de la escena para navegar contenido sin salir del modo; la portada-cloud **sigue siendo el centro**
(el estante va a la derecha-delante, no la tapa).

- **Invocable/ocultable** con un botón del overlay (lucide `layout-grid`); selector de fuente en el
  popover de ajustes (Oculto/Cola/Playlists), persistido en prefs (`shelfSource`). Fuentes:
  - **Cola**: `PlayerStore.queue()` (sin fetch, portadas ya resueltas); seleccionar → `jumpTo`.
  - **Playlists**: `PlaylistsStore.playlists()`; portada = `coverImage` (placeholder si `null`, sin
    fetch por canción); seleccionar → `getSongs(id)` → `setQueue`.
- **Tarjeta central resaltada/elevada** suavemente (se acerca y se desplaza hacia el centro); las
  demás recedidas y atenuadas. Easing suave, sin rebotes. Bajo `prefers-reduced-motion` el
  desplazamiento es instantáneo (sin "float").
- **Etiqueta 3D**: texto del título bajo cada tarjeta (canvas-texture); color leído del token
  `--foreground` (no hex). Se regenera al reciclar la tarjeta y se hace `dispose`.
- **Navegación**: arrastre **vertical** sobre la lista (drag) y/o botones arriba/abajo del overlay;
  **selección** = clic en la tarjeta central (o botón ▶ del overlay) → acción según fuente (Cola → `jumpTo`).
- **Accesible**: además del 3D (ratón), el overlay ofrece prev/centro(caption)/siguiente/▶ por teclado.
- **Rendimiento (no negociable)**: nunca construye toda la lista — **ventana** de ±4 tarjetas con
  **reciclaje** y **carga perezosa/`dispose`** de texturas; memoria acotada al pool. `dispose()`
  completo al ocultar y al destruir el engine.
- **Coordinación con la cámara**: raycast en `pointerdown` (captura) — si golpea tarjeta, no orbita
  (`stopPropagation`); arrastrar el **fondo** sí orbita (en modo Manual).

## Escenario de letras 3D (Fase 2 ext)

Las letras **sincronizadas** se muestran **dentro de la escena** con `CSS3DRenderer` (texto DOM real,
nítido, accesible, Inter), no en un panel lateral — para que ganen **profundidad/parallax** al orbitar.

- **Billboard**: cada línea copia `camera.quaternion` → siempre legible aunque el usuario orbite; la
  profundidad da el parallax. Columna a la **izquierda** (despeja la portada al centro y el estante a
  la derecha).
- **Ventana** de líneas (activa ±3, recicladas — no una por línea de la canción). Activa centrada,
  mayor escala/opacidad (`--foreground`); vecinas retroceden en z, menor escala/opacidad (`--soft`).
  Tween suave al cambiar de línea; **instantáneo** bajo `prefers-reduced-motion`.
- **No pasa por el bloom** (capa CSS3D aparte) → crujiente y sereno. Sombra de texto sutil para
  contraste sobre la portada (no panel opaco). `aria-live="polite"` anuncia la línea activa.
- Click en la línea activa → `seek` (solo esa línea habilita `pointer-events`).
- Sin `syncedLyrics`: fallback a panel plano lateral. `dispose()` quita el `domElement` y limpia objetos.

## Portada volumétrica + vibración (Fase 2 ext)

La portada es una **nube con profundidad real** cuyas partículas **vibran** con la música, vía
`ShaderMaterial` (GPU) en vez de `PointsMaterial`.

- **Volumen**: z por brillo (RELIEF alto) + jitter de profundidad por partícula → nube, no lámina. El
  brillo **domina** la profundidad para que la obra siga reconocible; el yaw suave revela el parallax.
- **Vibración** (vertex shader): temblor en z por bass/beat + shimmer lateral leve, **acotado y por
  fase aleatoria** (no estroboscopio). El beat-pulse de escala del grupo se elimina (la reactividad va
  por partícula). El `update()` solo escribe uniforms (barato a grid alto).
- **`prefers-reduced-motion`** → `uReduced=1`: nube volumétrica pero **quieta** (sin temblor ni yaw).
- Bloom sigue sutil (techo bajo). `ShaderMaterial.dispose()` al reconstruir/destruir.

## Estante: render fuera del bloom

El estante se dibuja en **su propia escena tras el composer** (`clearDepth` + `renderer.render`), de
modo que las **portadas quedan nítidas** y no se "queman" con el bloom de la escena principal.

## Cámara — Auto / Manual (Fase 2)

- **Auto** (por defecto): deriva cinemática lenta conducida por el engine; portada centrada.
  Bajo `prefers-reduced-motion` la deriva se desactiva (escena calma).
- **Manual**: el usuario orbita arrastrando el **fondo** y hace zoom con la rueda
  (OrbitControls con `enableDamping` para una sensación suave; sin paneo, para no descentrar la
  portada). Dolly **acotado** (`minDistance 12` / `maxDistance 40`) alrededor de la distancia por
  defecto (`z=22`). `manual` se permite aunque haya `prefers-reduced-motion` (es interacción directa).
- El **clic sobre una tarjeta del estante NO orbita** (raycast en `pointerdown`); arrastrar el fondo sí.
- Modo y encuadre manual (distancia/ángulos) se **persisten** en prefs (`cameraMode`, `cameraState`).
- Botón **«Restablecer vista»** vuelve al encuadre por defecto y olvida el guardado.
- El overlay es `pointer-events-none`; solo los clústeres de control reactivan el puntero, de modo
  que el arrastre sobre el vacío llega al canvas.

## Rendimiento

- `renderer.setPixelRatio(Math.min(2, devicePixelRatio))`; pausar RAF en `document.hidden`.
- `dispose()` de geometrías/materiales/texturas/renderer al salir. Sin fugas al abrir/cerrar repetido.
- No tocar signals dentro del bucle de render (ver reglas en la tarea).

## Accesibilidad

- Botones solo-icono con `aria-label`; foco visible (anillo turquesa global) en todo el overlay.
- El modo es **opcional y reversible**; salir siempre disponible (botón + `Esc`).
- Contraste del texto del overlay ≥ 4.5:1 sobre el fondo (usar scrim/`bg-surface-2/60` bajo el texto si
  el canvas detrás sube de brillo). El color nunca es el único indicador de estado.
- Respeta `prefers-reduced-motion` como arriba.

## Do / Don't (específico de esta página)

| ✅ Do | ❌ Don't |
|------|---------|
| Turquesa + acento derivado de portada, mezclado | Paleta saturada / arcoíris / segundo acento libre |
| Movimiento lento y continuo | Camera-shake, flashes, pulsos violentos |
| Leer color desde CSS vars en el motor | Hex hardcodeado en el código WebGL |
| Fallback real para `prefers-reduced-motion` | Asumir que el CSS global ya frena el canvas |
| `dispose()` + pausa en background | Dejar RAF y GPU corriendo al salir |
| Reusar `PlayerStore` para transporte | Duplicar estado de reproducción |
| Reimplementar efectos en TS propio | Copiar código de Mineradio (GPL-3.0) |
| Cámara manual con damping + dolly acotado | Orbitar al clicar una tarjeta del estante |
| Persistir encuadre manual + botón de reset | Dejar al usuario "perdido" sin volver al default |
| Estante con ventana + reciclaje + `dispose` | Construir todas las tarjetas / fugar texturas |
| Lista vertical a la derecha, cloud al centro | Que el estante tape la portada protagonista |
| Etiqueta 3D con color de token (`--foreground`) | Hex hardcodeado en la textura de texto |
| Portada/estante/letra cada uno en su capa | Que el bloom queme portadas o letra |
| Letra 3D billboard + parallax, sereno | Escenario brillante giratorio (estilo Mineradio) |
| Vibración acotada por partícula (shader) | Temblor estroboscópico o caótico |
