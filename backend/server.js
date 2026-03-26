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

app.use(cors());
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
      image_url TEXT
    )`);
  }
});

// Middleware for JWT auth
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Login Route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const user = { name: username };
    const accessToken = jwt.sign(user, process.env.JWT_SECRET || 'secret');
    res.json({ accessToken });
  } else {
    res.status(401).send('Invalid Credentials');
  }
});

// Get all games
app.get('/api/games', (req, res) => {
  db.all("SELECT * FROM games ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      res.status(400).json({"error":err.message});
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
  const { steam_id, name, playtime_hours, playtime_minutes, achievement_count, total_achievements, image_url } = req.body;
  
  // Use INSERT OR REPLACE to handle overwrites if the steam_id already exists
  const sql = `INSERT OR REPLACE INTO games 
               (steam_id, name, playtime_hours, playtime_minutes, achievement_count, total_achievements, image_url) 
               VALUES (?,?,?,?,?,?,?)`;
  const params = [steam_id, name, playtime_hours, playtime_minutes, achievement_count, total_achievements, image_url];
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(400).json({"error": err.message});
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
  db.run(sql, [playtime_hours, playtime_minutes, steam_id], function(err) {
    if (err) {
      res.status(400).json({"error": err.message});
      return;
    }
    res.json({ "message": "updated", "changes": this.changes });
  });
});

// Delete a game
app.delete('/api/games/:steam_id', authenticateToken, (req, res) => {
  const { steam_id } = req.params;
  db.run('DELETE FROM games WHERE steam_id = ?', steam_id, function(err) {
    if (err) {
      res.status(400).json({"error": err.message});
      return;
    }
    res.json({"message":"deleted", rows: this.changes});
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
