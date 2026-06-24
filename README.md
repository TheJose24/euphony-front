# Euphony Design — Angular 21

Premium dark-mode music dashboard. This is the **Angular 21 (standalone, zoneless, signals) + Tailwind CSS** migration of the original Vite + React + shadcn/ui app.

## Stack

- **Angular 21** — standalone components, zoneless change detection, signal-based state, native control flow (`@if` / `@for`), lazy-loaded routes.
- **Tailwind CSS v3** — same design tokens as the original (HSL CSS variables for the turquoise `#00E6D0` brand, surfaces, playlist dots, etc.).
- **lucide-angular** — icon set (mirrors `lucide-react`).
- **pnpm** — package manager.

## Getting started

```bash
pnpm install
pnpm start        # dev server → http://localhost:4200
pnpm build        # production build → dist/euphony-design
```

## Architecture

Scalable `core / shared / layout / features` layout:

```
src/app/
├── app.ts / app.config.ts / app.routes.ts   # bootstrap, providers, lazy routes
├── core/                                     # framework-agnostic singletons
│   ├── models/        track.model.ts         # Track, FavoriteItem interfaces
│   ├── data/          tracks.data.ts         # mock tracks / albums / asset paths
│   ├── state/         player.store.ts        # signal store (playback) — was Zustand usePlayer
│   │                  auth.store.ts          # signal store (auth)     — was Zustand useAuth
│   └── utils/         format.ts              # toSeconds / fmtTime
├── shared/
│   ├── ui/            logo/                   # brand mark (uses recursos logo.png)
│   └── icons/         lucide-icons.ts         # central icon registration (root provider)
├── layout/                                    # app shell
│   ├── app-layout/                            # sidebar + topbar + content slot + right slot + player bar
│   ├── sidebar/  (+ nav-item/)
│   ├── search-bar/   user-avatar/   player-bar/
└── features/                                  # routed feature areas
    ├── auth/login/
    ├── home/  (+ components/playlist-header, track-table, right-panel)
    ├── player/
    └── not-found/
```

### React → Angular mapping

| React | Angular |
| --- | --- |
| Zustand `usePlayer` / `useAuth` | `PlayerStore` / `AuthStore` (`@Injectable`, signals) |
| `react-router-dom` | `@angular/router` (lazy `loadComponent`) |
| `useState` / `useMemo` | `signal()` / `computed()` |
| props / callbacks | `input()` / `output()` / `model()` |
| `lucide-react` | `lucide-angular` |
| `@/assets/*.jpg` imports | files under `public/assets/` |

Brand assets come from `recursos/`: `logo.png` is used as the Euphony mark (sidebar + login) and as the apple-touch-icon; `favicon.ico` is the favicon.
