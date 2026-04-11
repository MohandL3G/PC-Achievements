require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is missing.");
  process.exit(1);
}

if (!process.env.ADMIN_PASSWORD) {
  console.error("FATAL ERROR: ADMIN_PASSWORD environment variable is missing.");
  process.exit(1);
}

const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per 15 minutes
  message: "Too many login attempts from this IP, please try again after 15 minutes."
});

const allowedOrigins = [
  'https://ach.mohandl3g.ly',
  'https://ach.mohandl3g.ddnsgeek.com',
  'http://internal.docker',
  'http://192.168.0.100',
  'http://localhost',
  'http://localhost:5173', // Vite local development
  'http://localhost:5000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like same-origin relative requests, server-to-server, or curl)
    if (!origin) return callback(null, true);
    
    // Check if the exact origin is in our allowed list
    // OR if it starts with localhost (to allow any local port)
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
  }
}));
app.use(bodyParser.json());

// Database setup
const dbPath = path.resolve(__dirname, 'achievements.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      steam_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      playtime_hours INTEGER DEFAULT 0,
      playtime_minutes INTEGER DEFAULT 0,
      achievement_count INTEGER DEFAULT 0,
      total_achievements INTEGER DEFAULT 0,
      image_url TEXT,
      is_steam_playtime INTEGER DEFAULT 0
    )`);
  }
});

// Middleware for JWT auth
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Login Route
app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (username !== process.env.ADMIN_USERNAME) {
    return res.status(401).send('Invalid Credentials');
  }

  const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD);
  if (isMatch) {
    const user = { name: username };
    const accessToken = jwt.sign(user, process.env.JWT_SECRET);
    res.json({ accessToken });
  } else {
    res.status(401).send('Invalid Credentials');
  }
});

// Get all games
app.get('/api/games', (req, res) => {
  db.all("SELECT * FROM games ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json(rows);
  });
});

// Fetch game info from Steam
app.get('/api/steam/game/:steam_id', async (req, res) => {
  const { steam_id } = req.params;
  const apiKey = process.env.STEAM_API_KEY;
  const steamUserId = process.env.STEAM_USER_ID;

  if (!apiKey || apiKey === 'YOUR_STEAM_API_KEY') {
    return res.status(400).json({ error: 'Steam API Key not configured' });
  }

  try {
    // 1. Fetch game details (schema) to get total achievements
    let schemaRes;
    try {
      schemaRes = await axios.get(`http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${steam_id}`);
    } catch (err) {
      console.error('Steam Schema API Error:', err.response?.data || err.message);
      return res.status(500).json({ error: 'Failed to fetch game schema from Steam. Is the Steam AppID correct?' });
    }

    // 2. Fetch Store Details to get the correct Public Name
    let gameName = schemaRes.data.game?.gameName;
    try {
      const storeRes = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${steam_id}`);
      if (storeRes.data[steam_id]?.success) {
        gameName = storeRes.data[steam_id].data.name;
      }
    } catch (err) {
      console.warn('Steam Store API Error (using schema name):', err.message);
    }

    if (!gameName) {
      return res.status(404).json({ error: 'Game not found on Steam' });
    }

    const achievements = schemaRes.data.game?.availableGameStats?.achievements || [];
    const totalAchievements = achievements.length;

    // 3. Fetch user's playtime from Steam
    let steamPlaytime = null;
    if (apiKey && steamUserId && steamUserId !== 'YOUR_STEAM_ID_64_BIT') {
      try {
        const playtimeRes = await axios.get(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamUserId}&format=json&appids_filter[0]=${steam_id}`);
        const gameInfo = playtimeRes.data.response?.games?.[0];
        if (gameInfo) {
          steamPlaytime = {
            hours: Math.floor(gameInfo.playtime_forever / 60),
            minutes: gameInfo.playtime_forever % 60
          };
        }
      } catch (err) {
        console.warn('Steam Playtime API Error (Ignoring):', err.message);
      }
    }

    // 4. Game Image URL
    const imageUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${steam_id}/header.jpg`;

    res.json({
      steam_id,
      name: gameName,
      achievement_count: totalAchievements, // Always 100% completion
      total_achievements: totalAchievements,
      image_url: imageUrl,
      steam_playtime: steamPlaytime
    });
  } catch (error) {
    console.error('Steam API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch game data from Steam' });
  }
});

// Add or Update a game
app.post('/api/games', authenticateToken, (req, res) => {
  const { steam_id, name, playtime_hours, playtime_minutes, achievement_count, total_achievements, image_url, is_steam_playtime } = req.body;

  // Use INSERT ... ON CONFLICT to avoid changing the ID and moving it to the top
  const sql = `INSERT INTO games 
               (steam_id, name, playtime_hours, playtime_minutes, achievement_count, total_achievements, image_url, is_steam_playtime) 
               VALUES (?,?,?,?,?,?,?,?)
               ON CONFLICT(steam_id) DO UPDATE SET
                 name=excluded.name,
                 playtime_hours=excluded.playtime_hours,
                 playtime_minutes=excluded.playtime_minutes,
                 achievement_count=excluded.achievement_count,
                 total_achievements=excluded.total_achievements,
                 image_url=excluded.image_url,
                 is_steam_playtime=excluded.is_steam_playtime`;
  const params = [steam_id, name, playtime_hours, playtime_minutes, achievement_count, total_achievements, image_url, is_steam_playtime ? 1 : 0];

  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json({
      "message": "success",
      "data": { id: this.lastID, ...req.body }
    });
  });
});

// Update playtime only
app.put('/api/games/:steam_id', authenticateToken, (req, res) => {
  const { steam_id } = req.params;
  const { playtime_hours, playtime_minutes } = req.body;

  const sql = 'UPDATE games SET playtime_hours = ?, playtime_minutes = ? WHERE steam_id = ?';
  db.run(sql, [playtime_hours, playtime_minutes, steam_id], function (err) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json({ "message": "updated", "changes": this.changes });
  });
});

// Delete a game
app.delete('/api/games/:steam_id', authenticateToken, (req, res) => {
  const { steam_id } = req.params;
  db.run('DELETE FROM games WHERE steam_id = ?', steam_id, function (err) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json({ "message": "deleted", rows: this.changes });
  });
});

// Bulk delete games
app.post('/api/games/bulk-delete', authenticateToken, (req, res) => {
  const { steam_ids } = req.body;
  if (!Array.isArray(steam_ids) || steam_ids.length === 0) {
    return res.status(400).json({ error: 'No game IDs provided' });
  }

  const placeholders = steam_ids.map(() => '?').join(',');
  const sql = `DELETE FROM games WHERE steam_id IN (${placeholders})`;

  db.run(sql, steam_ids, function (err) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.json({ "message": "bulk deleted", rows: this.changes });
  });
});

// Bulk fetch Steam games playtime
app.get('/api/steam/playtimes', async (req, res) => {
  const apiKey = process.env.STEAM_API_KEY;
  const steamUserId = process.env.STEAM_USER_ID;

  if (!apiKey || apiKey === 'YOUR_STEAM_API_KEY' || !steamUserId || steamUserId === 'YOUR_STEAM_ID_64_BIT') {
    return res.status(400).json({ error: 'Steam API Key or User ID not configured' });
  }

  try {
    const playtimeRes = await axios.get(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamUserId}&format=json`);
    const games = playtimeRes.data.response?.games || [];

    const playtimes = {};
    for (const g of games) {
      playtimes[String(g.appid)] = {
        hours: Math.floor(g.playtime_forever / 60),
        minutes: g.playtime_forever % 60
      };
    }

    res.json(playtimes);
  } catch (error) {
    console.error('Steam API Error (Bulk Playtimes):', error.message);
    res.status(500).json({ error: 'Failed to fetch playtimes from Steam' });
  }
});

// Bulk update playtimes
app.put('/api/games/bulk-update-playtime', authenticateToken, (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("UPDATE games SET playtime_hours = ?, playtime_minutes = ? WHERE steam_id = ?");

    for (const update of updates) {
      stmt.run(update.playtime_hours, update.playtime_minutes, update.steam_id);
    }

    stmt.finalize();
    db.run("COMMIT", (err) => {
      if (err) {
        res.status(500).json({ error: 'Transaction failed', details: err.message });
      } else {
        res.json({ message: "bulk playtimes updated" });
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
