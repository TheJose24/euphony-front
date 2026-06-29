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
- Letra (lyric-stage): Inter, tamaño cómodo de lectura; línea actual no resaltada por tiempo (texto
  plano), solo presentación elegante (peso/opacidad/scroll suave).

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
