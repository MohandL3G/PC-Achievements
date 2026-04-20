# PC-Achievements

A full-stack web application designed to manage, track, and showcase your PC game library, playtime, and achievements, whether they are strictly from Steam or independently owned/pirated games.

## Features
- 🎮 **Game Management**: Keep track of your local games, playtime, and custom achievement completion tracking.
- 🔄 **Steam Integration**: Fetch and synchronize your public Steam library, game thumbnails, schema metadata, and playtime data utilizing the Steam Web API.
- 🔒 **Secure Admin Routing**: Password-protected backend endpoints to append, modify, or bulk-delete entries from the database, tightly secured via JWT validation, rate limiting, and bcrypt hashing.
- 🐳 **Docker Ready**: Frictionless production deployments with a single Docker image containing both frontend and backend.

## Tech Stack
- **Frontend**: React (Vite-compiled UI using modern ES Modules).
- **Backend**: Node.js, Express.js.
- **Database**: SQLite3 (Local, lightweight file database).
- **Security**: Bcrypt encryption, JSON Web Tokens (JWT).

## Deployment (Docker)

This is the recommended way to run the application for production. It uses a single Docker image containing both the frontend and the backend.

### 1. Build the Image
From the root directory, run:
```bash
docker build -t pc-achievements .
```

### 2. Run and Test Locally
To run the container locally with your configuration:

**PowerShell:**
```powershell
docker run -d `
  --name pc-achievements `
  -p 5000:5000 `
  -v ${PWD}/backend/achievements.db:/usr/src/app/achievements.db `
  -e STEAM_API_KEY="your_api_key" `
  -e STEAM_USER_ID="your_steam_id" `
  -e JWT_SECRET="your_secret" `
  -e ADMIN_USERNAME="admin" `
  -e ADMIN_PASSWORD='bcrypt_hash_here' `
  pc-achievements
```

**Bash:**
```bash
docker run -d \
  --name pc-achievements \
  -p 5000:5000 \
  -v $(pwd)/backend/achievements.db:/usr/src/app/achievements.db \
  -e STEAM_API_KEY="your_api_key" \
  -e STEAM_USER_ID="your_steam_id" \
  -e JWT_SECRET="your_secret" \
  -e ADMIN_USERNAME="admin" \
  -e ADMIN_PASSWORD='bcrypt_hash_here' \
  pc-achievements
```

> [!IMPORTANT]
> **Database Persistence**: Always mount a volume to `/usr/src/app/achievements.db` to ensure your data persists when the container is updated or removed.

### 3. Environment Variables
| Variable | Description |
| --- | --- |
| `PORT` | The port the server runs on (default: 5000) |
| `STEAM_API_KEY` | Your Steam Web API Key |
| `STEAM_USER_ID` | Your 64-bit Steam ID |
| `JWT_SECRET` | Secret key for JWT signing |
| `ADMIN_USERNAME` | Username for the admin panel |
| `ADMIN_PASSWORD` | **Bcrypt hash** of your admin password (use single quotes) |

---

## Development

If you wish to run the project locally for development:

1. **Backend:** 
   ```bash
   cd backend
   npm install
   npm start
   ```
2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Note: Frontend in dev mode will proxy requests to `localhost:5000`.*