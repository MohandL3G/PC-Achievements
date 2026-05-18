const { Router } = require('express');
const axios = require('axios');

const router = Router();

router.get('/game/:steam_id', async (req, res) => {
  const { steam_id } = req.params;
  const apiKey = process.env.STEAM_API_KEY;
  const steamUserId = process.env.STEAM_USER_ID;

  if (!apiKey || apiKey === 'YOUR_STEAM_API_KEY') {
    return res.status(400).json({ error: 'Steam API Key not configured' });
  }

  try {
    let schemaRes;
    try {
      schemaRes = await axios.get(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${steam_id}`);
    } catch (err) {
      console.error('Steam Schema API Error:', err.response?.data || err.message);
      return res.status(500).json({ error: 'Failed to fetch game schema from Steam. Is the Steam AppID correct?' });
    }

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

    let steamPlaytime = null;
    if (apiKey && steamUserId && steamUserId !== 'YOUR_STEAM_ID_64_BIT') {
      try {
        const playtimeRes = await axios.get(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamUserId}&format=json&appids_filter[0]=${steam_id}`);
        const gameInfo = playtimeRes.data.response?.games?.[0];
        if (gameInfo) {
          steamPlaytime = {
            hours: Math.floor(gameInfo.playtime_forever / 60),
            minutes: gameInfo.playtime_forever % 60,
          };
        }
      } catch (err) {
        console.warn('Steam Playtime API Error (Ignoring):', err.message);
      }
    }

    const imageUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${steam_id}/header.jpg`;

    res.json({
      steam_id,
      name: gameName,
      achievement_count: totalAchievements,
      total_achievements: totalAchievements,
      image_url: imageUrl,
      steam_playtime: steamPlaytime,
    });
  } catch (error) {
    console.error('Steam API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch game data from Steam' });
  }
});

router.get('/playtimes', async (req, res) => {
  const apiKey = process.env.STEAM_API_KEY;
  const steamUserId = process.env.STEAM_USER_ID;

  if (!apiKey || apiKey === 'YOUR_STEAM_API_KEY' || !steamUserId || steamUserId === 'YOUR_STEAM_ID_64_BIT') {
    return res.status(400).json({ error: 'Steam API Key or User ID not configured' });
  }

  try {
    const playtimeRes = await axios.get(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamUserId}&format=json`);
    const games = playtimeRes.data.response?.games || [];

    const playtimes = {};
    for (const g of games) {
      playtimes[String(g.appid)] = {
        hours: Math.floor(g.playtime_forever / 60),
        minutes: g.playtime_forever % 60,
      };
    }

    res.json(playtimes);
  } catch (error) {
    console.error('Steam API Error (Bulk Playtimes):', error.message);
    res.status(500).json({ error: 'Failed to fetch playtimes from Steam' });
  }
});

module.exports = router;
