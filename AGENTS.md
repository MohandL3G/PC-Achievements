# PC-Achievements — Agent Guide

## Structure

Monorepo with two packages: `backend/` (Express 5, CommonJS) and `frontend/` (React 19 + Vite 8, ESM).
The root `Dockerfile` builds both into a single production image (`node:20-slim`).

## Quick start (dev)

```powershell
cd backend; cp .env.example .env  # fill with real secrets
cd backend; npm install; npm run dev   # nodemon on :5000
cd frontend; npm install; npm run dev  # Vite on :5173, proxies /api → :5000
```

Or run `.\Run-Locally.ps1` to launch both in separate windows.

## Key commands

| What | Command (from root) |
|---|---|
| Backend dev | `cd backend && npm run dev` |
| Backend prod | `cd backend && npm start` |
| Frontend dev | `cd frontend && npm run dev` |
| Frontend build | `cd frontend && npm run build` (runs `tsc -b && vite build`) |
| Frontend lint | `cd frontend && npm run lint` |
| Backend test | `cd backend && npm test` (mocha — needs JWT_SECRET set) |
| Frontend test | `cd frontend && npm test` (vitest) |
| Docker build & push | `.\Build-And-Push.ps1` |
| Update deps | `.\Update-Dependencies.ps1` |

## Environment

Backend reads `.env` via `dotenv`. Missing `JWT_SECRET` or `ADMIN_PASSWORD` causes a fatal error at startup.

| Var | Required | Notes |
|---|---|---|
| `STEAM_API_KEY` | Yes | Steam Web API key |
| `STEAM_USER_ID` | Yes | 64-bit Steam ID |
| `JWT_SECRET` | Yes | JWT signing secret |
| `ADMIN_PASSWORD` | Yes | **Bcrypt hash** (code uses `bcrypt.compare`) |
| `ADMIN_USERNAME` | No | Default `admin` |
| `DATABASE_PATH` | No | Default `backend/achievements.db` |
| `PORT` | No | Default `5000` |

Generate bcrypt hash: `node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"`

## Architecture notes

- **Backend entrypoint**: `backend/server.js` (routing only) → logic in `backend/src/` (`routes/`, `middleware/`, `services/`, `db.js`, `config.js`)
- **Frontend entrypoint**: `frontend/src/main.tsx` → `<App />` orchestrated from `App.tsx` (~280 lines), with separate component, hook, and API files
- **Database**: SQLite3 via `sqlite3`, auto-creates `games` and `game_achievements` tables on startup
- **Validation**: Zod v4 schemas in `backend/src/middleware/validate.js` with middleware wrapper
- **Auth**: JWT (HS256) with bcrypt login at `POST /api/login`, rate-limited (5 tries / 15 min)
- **CORS**: Allows localhost origins + configured production domains (`backend/src/config.js`)
- **CSP**: Configured in `server.js` via Helmet — allows `*.steamstatic.com` and `*.akamaihd.net` for images
- **Vite proxy**: `vite.config.ts` DOES proxy `/api` → `localhost:5000` (contrary to what some docs may claim)
- **Module systems**: backend = CommonJS, frontend = ESM (`"type": "module"`)
- **Path alias**: Frontend uses `@/` → `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`)
- **Tailwind**: v4 with `@tailwindcss/vite` plugin (no PostCSS config needed)
- **ESLint**: Flat config (`eslint.config.js`) with `typescript-eslint`, `react-hooks`, `react-refresh`
- **No `.env` is committed** — it's in `.gitignore`

## PowerShell scripts

| Script | What it does |
|---|---|
| `Run-Locally.ps1` | Starts backend + frontend in separate PowerShell windows |
| `Build-And-Push.ps1` | `docker build` ➜ `docker push` ➜ cleanup history + builder cache |
| `Update-Dependencies.ps1` | `npm update` + `npm audit fix` for both packages |
| `Auto-Update-Deploy.ps1` | Runs Update → Build-And-Push → commits package.json changes |

## Testing

- **Backend** (Mocha + Chai + Supertest): `cd backend && npm test`. Existing tests: `auth.test.js`, `validate.test.js`.
- **Frontend** (Vitest + Testing Library + jsdom): `cd frontend && npm test`. Existing tests: `utils.test.ts`, `Header.test.tsx`.
- Vitest config is embedded in `vite.config.ts` (environment: jsdom, globals: true).

## Docker

- Root `Dockerfile` (multi-stage):
  1. `node:20-slim` builds frontend (`npm run build`)
  2. `node:20-slim` compiles native `sqlite3` (`--build-from-source=sqlite3`) plus copies backend
  3. Final stage runs as `node` user, serves built frontend from `./public`
- Built frontend is served by Express via `express.static('public')` with SPA fallback at `*path`
- Healthcheck: GET `/api/games` every 30s
- Compose mounts `./database` volume for SQLite persistence + Caddy for HTTPS
- Standalone Dockerfiles in `backend/Dockerfile` and `frontend/Dockerfile` exist but are unused

```powershell
docker build -t pc-achievements .
docker compose up -d
```

## Key API endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `POST /api/login` | Rate-limited | Login, returns JWT |
| `GET /api/games` | No | List all games |
| `POST /api/games` | JWT | Add/update a game |
| `DELETE /api/games/:steam_id` | JWT | Delete a game |
| `POST /api/games/bulk-delete` | JWT | Bulk delete |
| `PUT /api/games/:steam_id` | JWT | Update playtime only |
| `PUT /api/games/bulk-update-playtime` | JWT | Bulk update playtimes |
| `POST /api/games/sync-achievements` | JWT | Sync all achievements (background) |
| `GET /api/games/:steam_id/achievements` | No | Get achievements for a game |
| `GET /api/steam/game/:steam_id` | No | Fetch game info from Steam |
| `GET /api/steam/playtimes` | No | Bulk fetch Steam playtimes |
| `GET /api/stats` | No | Rare achievements count |
