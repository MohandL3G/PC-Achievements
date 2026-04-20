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

## Deployment (Docker Compose)

This is the recommended way to run the application for production. It uses a single pre-built Docker image hosted on Docker Hub.

### 1. Download `docker-compose.yml`

You can download the `docker-compose.yml` file directly to your machine:

**Using curl:**
```bash
curl -O https://forgejo.mohandl3g.ly/***REMOVED***/PC-Achievements/raw/branch/main/docker-compose.yml
```

**Using wget:**
```bash
wget https://forgejo.mohandl3g.ly/***REMOVED***/PC-Achievements/raw/branch/main/docker-compose.yml
```

*Alternatively*, you can create a `docker-compose.yml` file manually and paste the following configuration:

```yaml
name: pc-achievements
services:
  app:
    image: mohandl3g/pc-achievements:latest
    container_name: pc-achievements
    ports:
      - "5000:5000"
    volumes:
      - ./database:/database
    environment:
      - DATABASE_PATH=/database/achievements.db
      - STEAM_API_KEY=your_api_key
      - STEAM_USER_ID=your_steam_id
      - JWT_SECRET=your_secret
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD='bcrypt_hash_here' # Use single quotes for the hash!
    restart: unless-stopped
```

### 2. Configure and Run

1. Open the downloaded or created `docker-compose.yml` file and update the environment variables with your actual credentials.
2. Start the container in the background:

```bash
docker compose up -d
```

> [!IMPORTANT]
> **Database Persistence**: The volume mapping `./database:/database` ensures your database persists across container updates. Make sure to back up this folder regularly.

### Environment Variables
| Variable | Description |
| --- | --- |
| `DATABASE_PATH` | Path where the SQLite db is stored (default: `/database/achievements.db`) |
| `STEAM_API_KEY` | Your Steam Web API Key |
| `STEAM_USER_ID` | Your 64-bit Steam ID |
| `JWT_SECRET` | Secret key for JWT signing |
| `ADMIN_USERNAME` | Username for the admin panel |
| `ADMIN_PASSWORD` | **Bcrypt hash** of your admin password (use single quotes) |

---

## Deployment (Manual Docker Build)

If you prefer to build the image yourself from source instead of using Docker Compose:

### 1. Build the Image
From the root directory, run:
```bash
docker build -t pc-achievements .
```

### 2. Run the Container
```bash
docker run -d \
  --name pc-achievements \
  -p 5000:5000 \
  -v $(pwd)/database:/database \
  -e DATABASE_PATH="/database/achievements.db" \
  -e STEAM_API_KEY="your_api_key" \
  -e STEAM_USER_ID="your_steam_id" \
  -e JWT_SECRET="your_secret" \
  -e ADMIN_USERNAME="admin" \
  -e ADMIN_PASSWORD='bcrypt_hash_here' \
  pc-achievements
```

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