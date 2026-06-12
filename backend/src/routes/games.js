const { Router } = require('express');
const db = require('../db');
const authenticateToken = require('../middleware/auth');
const { z } = require('zod');
const { validate, addGameSchema, updatePlaytimeSchema, bulkDeleteSchema } = require('../middleware/validate');
const { fetchAndSaveAchievementsForGame } = require('../services/steam');

const router = Router();

router.get('/', (req, res) => {
  db.all("SELECT * FROM games ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      res.status(400).json({ error: "Failed to fetch games" });
      return;
    }
    res.json(rows);
  });
});

router.post('/', authenticateToken, validate(addGameSchema), (req, res) => {
  const { steam_id, name, playtime_hours, playtime_minutes, achievement_count, total_achievements, image_url, is_steam_playtime, is_owned } = req.body;

  const sql = `INSERT INTO games 
               (steam_id, name, playtime_hours, playtime_minutes, achievement_count, total_achievements, image_url, is_steam_playtime, is_owned, date_added) 
               VALUES (?,?,?,?,?,?,?,?,?,datetime('now'))
               ON CONFLICT(steam_id) DO UPDATE SET
                 name=excluded.name,
                 playtime_hours=excluded.playtime_hours,
                 playtime_minutes=excluded.playtime_minutes,
                 achievement_count=excluded.achievement_count,
                 total_achievements=excluded.total_achievements,
                 image_url=excluded.image_url,
                 is_steam_playtime=excluded.is_steam_playtime,
                 is_owned=excluded.is_owned`;
  const params = [steam_id, name, playtime_hours, playtime_minutes, achievement_count, total_achievements, image_url, is_steam_playtime ? 1 : 0, is_owned ? 1 : 0];

  db.run(sql, params, function (err) {
    if (err) {
      res.status(400).json({ error: "Failed to save game" });
      return;
    }
    res.json({
      message: "success",
      data: { id: this.lastID, ...req.body },
    });
    fetchAndSaveAchievementsForGame(steam_id);
  });
});

router.put('/bulk-update-playtime', authenticateToken, (req, res, next) => {
  const bulkUpdateSchema = z.object({
    updates: z.array(z.object({
      steam_id: z.string().min(1),
      playtime_hours: z.number().int().min(0),
      playtime_minutes: z.number().int().min(0).max(59),
    })).min(1),
  });
  const result = bulkUpdateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid data', details: result.error.issues });
  }
  req.body = result.data;
  next();
}, (req, res) => {
  const { updates } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("UPDATE games SET playtime_hours = ?, playtime_minutes = ? WHERE steam_id = ?");

    for (const update of updates) {
      stmt.run(update.playtime_hours, update.playtime_minutes, update.steam_id);
    }

    stmt.finalize();
    db.run("COMMIT", (err) => {
      if (err) {
        res.status(500).json({ error: 'Transaction failed' });
      } else {
        res.json({ message: "bulk playtimes updated" });
      }
    });
  });
});

router.put('/:steam_id', authenticateToken, validate(updatePlaytimeSchema), (req, res) => {
  const { steam_id } = req.params;
  const { playtime_hours, playtime_minutes } = req.body;

  const sql = 'UPDATE games SET playtime_hours = ?, playtime_minutes = ? WHERE steam_id = ?';
  db.run(sql, [playtime_hours, playtime_minutes, steam_id], function (err) {
    if (err) {
      res.status(400).json({ error: "Failed to update playtime" });
      return;
    }
    res.json({ message: "updated", changes: this.changes });
  });
});

router.delete('/:steam_id', authenticateToken, (req, res) => {
  const { steam_id } = req.params;
  db.run('DELETE FROM games WHERE steam_id = ?', steam_id, function (err) {
    if (err) {
      res.status(400).json({ error: "Failed to delete game" });
      return;
    }
    res.json({ message: "deleted", rows: this.changes });
  });
});

router.post('/bulk-delete', authenticateToken, validate(bulkDeleteSchema), (req, res) => {
  const { steam_ids } = req.body;

  const placeholders = steam_ids.map(() => '?').join(',');
  const sql = `DELETE FROM games WHERE steam_id IN (${placeholders})`;

  db.run(sql, steam_ids, function (err) {
    if (err) {
      res.status(400).json({ error: "Failed to bulk delete" });
      return;
    }
    res.json({ message: "bulk deleted", rows: this.changes });
  });
});

module.exports = router;
