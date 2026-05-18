const axios = require('axios');
const db = require('../db');

async function fetchAndSaveAchievementsForGame(steam_id) {
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey || apiKey === 'YOUR_STEAM_API_KEY') return;

  try {
    const schemaRes = await axios.get(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${steam_id}`);
    const achievements = schemaRes.data.game?.availableGameStats?.achievements || [];
    if (achievements.length === 0) return;

    let globalPercentages = [];
    try {
      const globalRes = await axios.get(`https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${steam_id}`);
      globalPercentages = globalRes.data.achievementpercentages?.achievements || [];
    } catch (e) {
      console.warn('Failed to fetch global percentages for', steam_id);
    }

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      const stmt = db.prepare(`INSERT INTO game_achievements 
        (steam_id, api_name, display_name, description, icon_url, rarity) 
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(steam_id, api_name) DO UPDATE SET 
          display_name=excluded.display_name,
          description=excluded.description,
          icon_url=excluded.icon_url,
          rarity=excluded.rarity`);

      for (const ach of achievements) {
        const percEntry = globalPercentages.find(p => p.name === ach.name);
        const rarity = percEntry ? parseFloat(percEntry.percent) : 100.0;
        stmt.run(steam_id, ach.name, ach.displayName, ach.description || '', ach.icon, rarity);
      }
      stmt.finalize();
      db.run("COMMIT");
    });
  } catch (err) {
    if (err.response?.status !== 400 && err.response?.status !== 403 && err.response?.status !== 404) {
      console.error('Failed to fetch/save achievements for', steam_id, err.message);
    }
  }
}

module.exports = { fetchAndSaveAchievementsForGame };
