# Product

## Register

product

## Users

Euphony es, antes que nada, una **pieza de portfolio/demo**: el dominio funcional es un
reproductor de streaming musical, pero la audiencia real es **quien revisa el craft front-end**
(reclutadores, clientes potenciales, otros desarrolladores). Por eso conviven dos lentes:

- **El "usuario" del producto**: un oyente que quiere descubrir y reproducir música, en escritorio
  y móvil, en sesiones casuales y frecuentes. Su trabajo: poner música buena con la mínima fricción
  y dejarla sonar.
- **El evaluador**: alguien que mira de cerca cada pantalla buscando coherencia, pulido y decisiones
  de diseño deliberadas. Cada detalle es entregable.

El objetivo central que mide el éxito es la **escucha inmersiva**: la música y los artistas son los
protagonistas y la interfaz desaparece alrededor de ellos.

## Product Purpose

Euphony es el **frontend de una plataforma de streaming de música**: catálogo (canciones, artistas,
álbumes, géneros), reproducción de audio real, likes y búsqueda. Existe para demostrar que una app
de streaming puede sentirse **premium, serena y nítida** sin copiar a los players dominantes —
construyendo identidad propia (turquesa sobre negro) y poniendo el contenido por delante de la
cromo. El éxito se ve cuando alguien navega, reproduce y se queda escuchando sin notar la UI, y
cuando quien la evalúa percibe craft en cada pantalla.

## Brand Personality

**Premium · sereno · nítido.** Lujo silencioso: nada grita. Negro profundo como lienzo, un único
acento turquesa usado con moderación para lo accionable y lo activo, jerarquía tranquila construida
con superficies en capas (no con ruido). Movimiento contenido y con propósito. La voz del producto
es discreta y segura — confía en el contenido y en el espacio negativo, no en adornos.

Emoción objetivo: **calma enfocada** mientras escuchas, y **confianza en el detalle** cuando lo
inspeccionas de cerca.

## Anti-references

- **Clon evidente de Spotify.** Nada de verde + layout idéntico. Euphony no puede leerse como un
  re-skin del player dominante; su identidad (turquesa sobre negro puro) es propia y deliberada.
- **Neón recargado / glassmorphism.** Sin exceso de glow, blur por todas partes ni estética
  "cyberpunk" chillona. El glow turquesa es puntual (CTA principal), no ambiente; el acento se usa
  con moderación.
- **Recargado / abarrotado.** Nada de saturar de banners, colores e información. El espacio negativo
  es parte del diseño; la música respira.
- **SaaS / dashboard corporativo genérico** (corolario del anterior): sin grids de cards idénticas,
  eyebrows en mayúscula sobre cada sección ni métricas con gradiente. No debe sentirse a plantilla
  de admin.

## Design Principles

1. **La música es la protagonista.** La UI recede para que las portadas, los artistas y el audio
   lideren. Si un elemento compite con el contenido por atención sin ganárselo, sobra.
2. **Identidad propia, nunca clon.** Cada decisión refuerza el sello Euphony (turquesa sobre negro,
   tipografía como estructura). Familiaridad de patrón sí (es producto); mimetismo de marca no.
3. **Calma sobre densidad — lujo silencioso.** Restricción deliberada: un solo acento, espacio
   negativo generoso, movimiento contenido (150–300ms, sin layout shift). Quitar antes que añadir.
4. **El detalle es el entregable.** Como pieza de portfolio, cada pantalla se trata como final:
   estados (hover/focus/active/disabled/loading/empty/error) completos, coherencia de vocabulario
   visual pantalla a pantalla, y pulido que aguanta la inspección de cerca.
5. **Accesible por diseño, no por parche.** El acento turquesa nunca es el único indicador de
   estado; el contraste y el foco son parte del look, no un añadido posterior.

## Accessibility & Inclusion

Objetivo: **WCAG 2.1 AA**, con atención reforzada en dos frentes propios de esta UI:

- **Motion**: soporte completo de `prefers-reduced-motion: reduce` (crossfade o transición instantánea
  como alternativa a cada animación). Hoy pendiente en `src/styles.css` — prioridad.
- **No depender del color**: con un único acento turquesa, el estado (activo/seleccionado/error)
  debe comunicarse también por forma, icono, peso o posición — nunca solo por color. Cuidado con
  daltonismo y con la legibilidad de `text-dim` (~3.5:1 sobre negro): reservado a texto grande,
  labels en mayúscula o decorativo; nunca body.

Mínimos no negociables (alineados con `design-system/MASTER.md` §9): contraste ≥4.5:1 en texto
normal y ≥3:1 en grande, foco visible turquesa en todo lo interactivo, `aria-label` en botones
solo-icono, `alt` descriptivo, y objetivos táctiles ≥44×44px.
