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
      is_steam_playtime INTEGER DEFAULT 0,
      is_owned INTEGER DEFAULT 0,
      date_added TEXT
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

    // Migration: add columns to existing tables
    db.all("PRAGMA table_info(games)", (err, columns) => {
      if (err) return;
      const hasDateAdded = columns.some((c) => c.name === "date_added");
      if (!hasDateAdded) {
        db.run("ALTER TABLE games ADD COLUMN date_added TEXT", (alterErr) => {
          if (alterErr) return;
          db.run(`UPDATE games SET date_added = datetime('now', '-' || ((SELECT COALESCE(MAX(id),0) FROM games) - id) || ' minutes') WHERE date_added IS NULL`);
        });
      }
      const hasIsOwned = columns.some((c) => c.name === "is_owned");
      if (!hasIsOwned) {
        db.run("ALTER TABLE games ADD COLUMN is_owned INTEGER DEFAULT 0");
      }
    });
  }
});

module.exports = db;
