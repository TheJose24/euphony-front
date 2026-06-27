# ============================================================
#  Euphony — imagen de producción (build Angular + nginx)
# ============================================================

# ---------- Etapa 1: build de la app Angular ----------
FROM node:22-alpine AS build
WORKDIR /app

# pnpm exacto declarado en package.json ("packageManager").
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

# Instala dependencias primero (mejor caché de capas).
# pnpm 11 bloquea por seguridad los scripts de build de deps nativas (esbuild,
# lmdb, …) y aborta con ERR_PNPM_IGNORED_BUILDS. Como el lockfile fija todas las
# versiones, permitimos esos scripts explícitamente para poder compilar.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --config.dangerouslyAllowAllBuilds=true

# Copia el resto del código y genera el build de producción.
COPY . .
RUN pnpm build

# ---------- Etapa 2: servidor estático (nginx) ----------
FROM nginx:alpine AS runtime

# Config de nginx para SPA (fallback a index.html) + caché de assets.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Solo los estáticos compilados; nada de Node ni código fuente.
COPY --from=build /app/dist/euphony-design/browser /usr/share/nginx/html

# Puerto interno; el reverse-proxy del VPS hace el proxy hacia aquí.
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
