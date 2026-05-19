# PC-Achievements — Agent Guide

## Structure

Monorepo with two packages: `backend/` (Express, CommonJS) and `frontend/` (React+Vite, ESM).
The root `Dockerfile` builds both into a single production image.

## Quick start (dev)

```powershell
# Terminal 1 — Backend on :5000
cd backend
cp .env.example .env        # edit with real values
npm install && npm run dev  # nodemon with auto-restart

# Terminal 2 — Frontend on :5173
cd frontend
npm install && npm run dev
```

Or run `.\Run-Locally.ps1` to launch both in separate windows.

## Key commands

| What | Command (from root) |
|---|---|
| Backend dev | `cd backend && npm run dev` |
| Backend prod | `cd backend && npm start` |
| Frontend dev | `cd frontend && npm run dev` |
| Frontend build | `cd frontend && npm run build` |
| Frontend lint | `cd frontend && npm run lint` |
| Docker build & push | `.\Build-And-Push.ps1` (pushes as `mohandl3g/pc-achievements:latest`) |
| Update deps | `.\Update-Dependencies.ps1` (runs `npm update + audit fix` in both) |

## Environment

Backend reads env vars via `dotenv` (`.env` file) or real env vars in prod/Docker.
Required vars:

- `STEAM_API_KEY` — Steam Web API key
- `STEAM_USER_ID` — 64-bit Steam ID
- `JWT_SECRET` — arbitrary secret
- `ADMIN_USERNAME` — default `admin`
- `ADMIN_PASSWORD` — **must be a bcrypt hash** (the code calls `bcrypt.compare` against it), not plaintext
- `DATABASE_PATH` — optional, default `backend/achievements.db`
- `PORT` — optional, default `5000`

The `.env.example` contains `ADMIN_PASSWORD=Ms@199903` (plaintext) — do **not** use it as-is; hash it first.

## Architecture notes

- Backend entrypoint: `backend/server.js` — single file with all routes, DB setup, Steam API calls
- Frontend entrypoint: `frontend/src/main.tsx` renders `<App />` (single component in `App.tsx`)
- Database: SQLite3, auto-creates `games` and `game_achievements` tables on startup
- Auth: JWT with bcrypt login at `POST /api/login`, rate-limited (5 tries / 15 min)
- CORS: allows `localhost:*`, `http://localhost:5173`, and configured production origins
- Known issue: `vite.config.ts` does **not** configure a dev proxy, but README claims it does. In dev, frontend requests to `/api/*` resolve against `localhost:5173` and **will fail** unless you add `server.proxy` to `vite.config.ts`. The backend's CORS allows `localhost:5173` for direct requests (using absolute URLs) as a workaround.
- Module systems: backend is CommonJS, frontend is ESM (`"type": "module"`)

## PowerShell automation scripts

| Script | What it does |
|---|---|
| `Run-Locally.ps1` | Starts backend + frontend in separate PowerShell windows |
| `Build-And-Push.ps1` | `docker build` ➜ `docker push` ➜ cleanup |
| `Update-Dependencies.ps1` | `npm update` + `npm audit fix` for both packages |
| `Auto-Update-Deploy.ps1` | Updates deps, builds/pushes Docker image, and commits if updates found |

## Testing

No tests exist. `backend/package.json` has a placeholder test script; frontend has no test runner.

## Frontend specifics

- React 19, Vite 8, TypeScript ~5.9
- TypeScript: strict mode, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`
- ESLint: `typescript-eslint/recommended`, `react-hooks`, `react-refresh`
- All UI logic in a single `App.tsx` (modals, state, handlers, rendering — ~940 lines)
- Build: `cd frontend && npm run build` (runs `tsc -b && vite build`)

## Docker

Production build uses root `Dockerfile` (multi-stage). Standalone Dockerfiles in `backend/Dockerfile` and `frontend/Dockerfile` are not used in the main pipeline.

```powershell
docker build -t pc-achievements .
docker compose up -d         # uses image mohandl3g/pc-achievements:latest
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
| `POST /api/games/sync-achievements` | JWT | Sync all achievements in background |
| `GET /api/games/:steam_id/achievements` | No | Get achievements for a game |
| `GET /api/steam/game/:steam_id` | No | Fetch game info from Steam |
| `GET /api/steam/playtimes` | No | Bulk fetch Steam playtimes |
| `GET /api/stats` | No | Rare achievements count |
