# Página: Login (`/login`) — overrides

> Delta sobre [MASTER](../MASTER.md). Componente:
> [login.ts](../../src/app/features/auth/login/login.ts) / `login.html`.

## Layout
Pantalla completa centrada (fuera de `<app-layout>`, sin sidebar/player). Card de formulario sobre
fondo oscuro: logo, campos email/password (inputs `bg-surface-2`, foco `border-primary/60` + ring
turquesa suave), botón primario (`bg-primary ... shadow-glow`), y botones sociales OAuth.

## Excepciones de color (documentadas)
- Botón **Apple**: `bg-black`. Botón **Facebook**: `bg-[#1877F2]`. Son **colores de marca OAuth**,
  única excepción permitida a la regla de tokens.
- ✅ (P0) El fondo de la card ya está tokenizado a `bg-background` (antes `bg-[#020202]`).

## Estado funcional (⚠️ mock — auth diferida)
- No llama al backend. `onSubmit` extrae el usuario del email, lo guarda en `AuthStore` y navega a
  `/home`. `userId` está **hardcoded** (`8de2facc-…`).
- Diseño de auth real (guard, interceptor Bearer, sesión, logout) documentado como deuda en el
  roadmap P3; se activa cuando el backend habilite OAuth2 + CORS
  (ver [docs_backend/PROMPT_CORS.md](../../docs_backend/PROMPT_CORS.md)).

## Accesibilidad
- Inputs con `label`/`for` o `aria-label`; tamaño táctil ≥ 44px; foco visible turquesa.
