# PC-Achievements

A full-stack web application designed to manage, track, and showcase your PC game library, playtime, and achievements, whether they are strictly from Steam or independently owned/pirated games.

## Features
- 🎮 **Game Management**: Keep track of your local games, playtime, and custom achievement completion tracking.
- 🔄 **Steam Integration**: Fetch and synchronize your public Steam library, game thumbnails, schema metadata, and playtime data utilizing the Steam Web API.
- 🔒 **Secure Admin Routing**: Password-protected backend endpoints to append, modify, or bulk-delete entries from the database, tightly secured via JWT validation, rate limiting, and bcrypt hashing.
- 🐳 **Docker Ready**: Frictionless production deployments with a predefined Docker Compose architecture routing an Angie frontend and a lightweight Express backend.

## Tech Stack
- **Frontend**: React (Vite-compiled UI using modern ES Modules).
- **Backend**: Node.js, Express.js.
- **Database**: SQLite3 (Local, lightweight file database).
- **Security**: Bcrypt encryption, JSON Web Tokens (JWT).

## Installation & Deployment

### 1. Configure the Environment
Navigate to the `backend/` directory and create or update the `.env` file to include your configurations:

```env
PORT=5000
STEAM_API_KEY=your_steam_api_key
STEAM_USER_ID=your_steam_id_64_bit
JWT_SECRET=a_very_long_secure_randomly_generated_string

ADMIN_USERNAME=admin_username_of_your_choice
# VERY IMPORTANT: Generate a bcrypt hash for your password and wrap it in SINGLE QUOTES. 
# Single quotes prevent Docker Compose from interpreting '$$' as environment variables.
# You can generate a hash by running: node -e "console.log(require('bcryptjs').hashSync('YourPassword', 10))"
ADMIN_PASSWORD='$2b$10$YourGeneratedBcryptHashHere...'
```

### 2. Run via Docker Compose (Recommended)
This application can be spun up as two containers instantly:

```bash
# Build the frontend and spin up both containers efficiently
docker compose up --build -d
```
The application will launch on your configured ports, with your `achievements.db` persistent volume being successfully mapped.

### 3. Run Manually (Development)
If you wish to view the platform locally without Docker virtualization:
- **Backend:** `cd backend && npm install && npm start`
- **Frontend:** `cd frontend && npm install && npm run dev`