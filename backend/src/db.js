const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, '..', 'achievements.db');
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
    db.run(`CREATE TABLE IF NOT EXISTS game_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      steam_id TEXT NOT NULL,
      api_name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      icon_url TEXT,
      rarity REAL DEFAULT 0,
      UNIQUE(steam_id, api_name)
    )`);
  }
});

module.exports = db;
