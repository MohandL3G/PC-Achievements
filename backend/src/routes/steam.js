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
    let schemaData = { gameName: null, availableGameStats: { achievements: [] } };
    try {
      const schemaRes = await axios.get(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${apiKey}&appid=${steam_id}`);
      schemaData = schemaRes.data.game || schemaData;
    } catch (err) {
      console.warn('Steam Schema API error (proceeding without achievements):', err.message);
    }

    let gameName = schemaData.gameName;
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

    const achievements = schemaData.availableGameStats?.achievements || [];
    const totalAchievements = achievements.length;

    let steamPlaytime = null;
    if (apiKey && steamUserId && steamUserId !== 'YOUR_STEAM_ID_64_BIT') {
      try {
        const ownRes = await axios.get(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamUserId}&include_played_free_games=1`);
        const ownGames = ownRes.data.response?.games || [];
        let gameInfo = ownGames.find(g => String(g.appid) === steam_id);

        if (!gameInfo) {
          try {
            const recentRes = await axios.get(`https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${apiKey}&steamid=${steamUserId}`);
            const recentGames = recentRes.data.response?.games || [];
            gameInfo = recentGames.find(g => String(g.appid) === steam_id);
          } catch (e) {
            console.warn('Steam RecentlyPlayed API Error:', e.message);
          }
        }

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
    let playtimeRes;
    try {
      playtimeRes = await axios.get(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamUserId}&format=json&include_played_free_games=1`);
    } catch {
      playtimeRes = { data: { response: { games: [] } } };
    }
    let games = playtimeRes.data.response?.games || [];
    if (games.length === 0) {
      const recentRes = await axios.get(`https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${apiKey}&steamid=${steamUserId}&format=json`);
      games = recentRes.data.response?.games || [];
    }

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
