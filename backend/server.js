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
  db.all("SELECT * FROM games", [], (err, rows) => {
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
    // 1. Fetch game details (schema) to get name and total achievements
    const schemaRes = await axios.get(`http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${steam_id}`);
    const gameName = schemaRes.data.game.gameName;
    const achievements = schemaRes.data.game.availableGameStats?.achievements || [];
    const totalAchievements = achievements.length;

    // 2. Fetch user's achievements progress
    let unlockedCount = 0;
    if (steamUserId && steamUserId !== 'YOUR_STEAM_ID_64_BIT') {
      const statsRes = await axios.get(`http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${apiKey}&steamid=${steamUserId}&appid=${steam_id}`);
      if (statsRes.data.playerstats.success) {
        unlockedCount = statsRes.data.playerstats.achievements.filter(a => a.achieved === 1).length;
      }
    }

    // 3. Game Image URL
    const imageUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${steam_id}/header.jpg`;

    res.json({
      steam_id,
      name: gameName,
      achievement_count: unlockedCount,
      total_achievements: totalAchievements,
      image_url: imageUrl
    });
  } catch (error) {
    console.error('Steam API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch game data from Steam' });
  }
});

// Add a game
app.post('/api/games', authenticateToken, (req, res) => {
  const { steam_id, name, playtime_hours, playtime_minutes, achievement_count, total_achievements, image_url } = req.body;
  const sql = 'INSERT INTO games (steam_id, name, playtime_hours, playtime_minutes, achievement_count, total_achievements, image_url) VALUES (?,?,?,?,?,?,?)';
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
