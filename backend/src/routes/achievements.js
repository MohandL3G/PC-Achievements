const { Router } = require('express');
const db = require('../db');
const authenticateToken = require('../middleware/auth');
const { fetchAndSaveAchievementsForGame } = require('../services/steam');

const router = Router();
const SYNC_TIMEOUT_MS = 5 * 60 * 1000;

router.get('/games/:steam_id/achievements', (req, res) => {
  const { steam_id } = req.params;
  db.all("SELECT * FROM game_achievements WHERE steam_id = ? ORDER BY rarity ASC", [steam_id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch achievements" });
    res.json(rows);
  });
});

router.post('/games/sync-achievements', authenticateToken, (req, res) => {
  db.all("SELECT DISTINCT steam_id FROM games", async (err, rows) => {
    if (err) return res.status(500).json({ error: "Failed to fetch games for sync" });
    res.json({ message: "Sync started in background for " + rows.length + " games" });

    console.log(`Starting bulk sync for ${rows.length} games...`);
    let count = 0;
    const startTime = Date.now();
    for (const row of rows) {
      if (Date.now() - startTime > SYNC_TIMEOUT_MS) {
        console.log(`Sync timed out after ${count}/${rows.length} games.`);
        break;
      }
      await fetchAndSaveAchievementsForGame(row.steam_id);
      count++;
      if (count % 10 === 0 || count === rows.length) {
        console.log(`Sync progress: ${count}/${rows.length} games processed.`);
      }
      await new Promise(r => setTimeout(r, 500));
    }
    console.log(`Bulk sync ${count === rows.length ? 'completed successfully' : 'timed out'}.`);
  });
});

router.get('/stats', (req, res) => {
  db.get("SELECT COUNT(*) as rareCount FROM game_achievements WHERE rarity <= 10.0", (err, row) => {
    if (err) return res.status(500).json({ error: "Failed to fetch stats" });
    res.json({ rareAchievements: row.rareCount });
  });
});

module.exports = router;
