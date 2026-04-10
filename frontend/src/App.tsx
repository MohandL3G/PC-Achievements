import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import avatarImg from "./assets/avatar.jpg";

interface Game {
  id?: number;
  steam_id: string;
  name: string;
  playtime_hours: number;
  playtime_minutes: number;
  achievement_count: number;
  total_achievements: number;
  image_url: string;
  is_steam_playtime?: number;
  steam_playtime?: {
    hours: number;
    minutes: number;
  } | null;
}

interface PlaytimeUpdate {
  steam_id: string;
  name: string;
  currentHours: number;
  currentMinutes: number;
  newHours: number;
  newMinutes: number;
  selected: boolean;
}

const API_BASE = "/api";

function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );

  // Batch edit mode state
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedSteamIds, setSelectedSteamIds] = useState<string[]>([]);

  // Bulk playtime updates state
  const [showUpdatePlaytimeModal, setShowUpdatePlaytimeModal] = useState(false);
  const [playtimeUpdates, setPlaytimeUpdates] = useState<PlaytimeUpdate[]>([]);
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Add/Edit game state
  const [newSteamId, setNewSteamId] = useState("");
  const [fetchedGame, setFetchedGame] = useState<Game | null>(null);
  const [playtimeHours, setPlaytimeHours] = useState(0);
  const [playtimeMinutes, setPlaytimeMinutes] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showOverwriteWarning, setShowOverwriteWarning] = useState(false);

  useEffect(() => {
    fetchGames();
    if (token) setIsLoggedIn(true);
  }, [token]);

  const fetchGames = async () => {
    try {
      const res = await axios.get(`${API_BASE}/games`);
      setGames(res.data);
    } catch (err) {
      console.error("Error fetching games", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/login`, { username, password });
      const newToken = res.data.accessToken;
      setToken(newToken);
      localStorage.setItem("token", newToken);
      setIsLoggedIn(true);
      setShowLogin(false);
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setIsBatchMode(false);
    setSelectedSteamIds([]);
  };

  const handleFetchGameInfo = async () => {
    if (!newSteamId) return;

    const exists = games.find((g) => g.steam_id === newSteamId);
    if (exists) {
      handleEditClick(exists);
      return;
    }

    setIsFetching(true);
    try {
      const res = await axios.get(`${API_BASE}/steam/game/${newSteamId}`);
      const gameData = {
        ...res.data,
        playtime_hours: 0,
        playtime_minutes: 0,
      };

      setFetchedGame(gameData);
      setShowOverwriteWarning(false);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to fetch game data");
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddGame = async () => {
    if (!fetchedGame || !token) return;
    try {
      const gameData = {
        ...fetchedGame,
        playtime_hours: playtimeHours,
        playtime_minutes: playtimeMinutes,
        // If playtime matches Steam playtime, mark it as a Steam import
        is_steam_playtime: fetchedGame.steam_playtime &&
          playtimeHours === fetchedGame.steam_playtime.hours &&
          playtimeMinutes === fetchedGame.steam_playtime.minutes ? 1 : 0
      };
      await axios.post(`${API_BASE}/games`, gameData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      closeModals();
      fetchGames();
    } catch (err) {
      alert("Failed to add/update game");
    }
  };

  const handleDeleteGame = async (steamId: string) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this game?")) return;

    try {
      await axios.delete(`${API_BASE}/games/${steamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchGames();
    } catch (err) {
      alert("Failed to delete game");
    }
  };

  const handleBulkDelete = async () => {
    if (!token || selectedSteamIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedSteamIds.length} games?`,
      )
    )
      return;

    try {
      await axios.post(
        `${API_BASE}/games/bulk-delete`,
        { steam_ids: selectedSteamIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSelectedSteamIds([]);
      setIsBatchMode(false);
      fetchGames();
    } catch (err) {
      alert("Failed to bulk delete games");
    }
  };

  const fetchPlaytimeUpdates = async () => {
    if (!token) return;
    setIsUpdatingBulk(true);
    try {
      const res = await axios.get(`${API_BASE}/steam/playtimes`);
      const steamPlaytimes = res.data;

      const updatesList: PlaytimeUpdate[] = [];

      games.forEach(game => {
        if (game.is_steam_playtime === 1) {
          const fetched = steamPlaytimes[game.steam_id];
          if (fetched) {
            // Compare playtimes
            if (game.playtime_hours !== fetched.hours || game.playtime_minutes !== fetched.minutes) {
              updatesList.push({
                steam_id: game.steam_id,
                name: game.name,
                currentHours: game.playtime_hours,
                currentMinutes: game.playtime_minutes,
                newHours: fetched.hours,
                newMinutes: fetched.minutes,
                selected: true // By default all are selected
              });
            }
          }
        }
      });

      setPlaytimeUpdates(updatesList);
      setShowUpdatePlaytimeModal(true);
    } catch (err) {
      alert("Failed to fetch steam playtimes");
    } finally {
      setIsUpdatingBulk(false);
    }
  };

  const handleBulkPlaytimeUpdate = async () => {
    const selectedUpdates = playtimeUpdates
      .filter(u => u.selected)
      .map(u => ({
        steam_id: u.steam_id,
        playtime_hours: u.newHours,
        playtime_minutes: u.newMinutes
      }));

    if (selectedUpdates.length === 0) {
      setShowUpdatePlaytimeModal(false);
      return;
    }

    try {
      await axios.put(`${API_BASE}/games/bulk-update-playtime`, { updates: selectedUpdates }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowUpdatePlaytimeModal(false);
      fetchGames();
    } catch (err) {
      alert("Failed to bulk update playtimes");
    }
  };

  const toggleUpdateSelection = (steam_id: string) => {
    setPlaytimeUpdates(prev => prev.map(u =>
      u.steam_id === steam_id ? { ...u, selected: !u.selected } : u
    ));
  };

  const handleEditClick = (game: Game) => {
    setFetchedGame(game);
    setNewSteamId(game.steam_id);
    setPlaytimeHours(game.playtime_hours);
    setPlaytimeMinutes(game.playtime_minutes);
    setIsEditing(true);
    setShowAddModal(true);
  };

  const updatePlaytime = async () => {
    if (!fetchedGame) return;
    setIsFetching(true);
    try {
      const res = await axios.get(`${API_BASE}/steam/game/${fetchedGame.steam_id}`);
      if (res.data.steam_playtime) {
        setPlaytimeHours(res.data.steam_playtime.hours);
        setPlaytimeMinutes(res.data.steam_playtime.minutes);
        setFetchedGame({
          ...fetchedGame,
          steam_playtime: res.data.steam_playtime
        });
      } else {
        alert("No Steam playtime found for this game.");
      }
    } catch (err) {
      alert("Failed to fetch updated playtime from Steam.");
    } finally {
      setIsFetching(false);
    }
  };

  const toggleGameSelection = (steamId: string) => {
    if (!isBatchMode) return;
    setSelectedSteamIds((prev) =>
      prev.includes(steamId)
        ? prev.filter((id) => id !== steamId)
        : [...prev, steamId],
    );
  };

  const closeModals = () => {
    setShowAddModal(false);
    setFetchedGame(null);
    setNewSteamId("");
    setPlaytimeHours(0);
    setPlaytimeMinutes(0);
    setIsEditing(false);
    setShowOverwriteWarning(false);
    setShowStatsModal(false);
    setShowUpdatePlaytimeModal(false);
  };

  const calculateStats = () => {
    const totalAchievements = games.reduce(
      (acc, game) => acc + game.achievement_count,
      0,
    );
    const totalMinutes = games.reduce(
      (acc, game) => acc + game.playtime_hours * 60 + game.playtime_minutes,
      0,
    );
    const totalHours = Math.floor(totalMinutes / 60);
    const finalMinutes = totalMinutes % 60;

    return {
      totalGames: games.length,
      totalAchievements,
      playtime: `${totalHours}h ${finalMinutes}m`,
      // Count as perfect if achievements match total OR if there are 0 achievements
      perfectGames: games.filter(
        (g) => g.achievement_count === g.total_achievements || g.total_achievements === 0
      ).length,
    };
  };

  const stats = calculateStats();

  // Helper to determine if a game is completed
  const isCompleted = (game: Game) => {
    return (
      game.achievement_count === game.total_achievements ||
      game.total_achievements === 0
    );
  };

  const filteredGames = games.filter(
    (game) =>
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.steam_id.includes(searchTerm),
  );

  return (
    <div className="container">
      <header>
        <div className="user-profile">
          <div className="avatar-placeholder">
            <img src={avatarImg} alt="MohandL3G" />
          </div>
          <span className="user-name">
            MohandL3G
            {isLoggedIn && (
              <button
                className={`edit-mode-btn ${isBatchMode ? "active" : ""}`}
                onClick={() => {
                  setIsBatchMode(!isBatchMode);
                  setSelectedSteamIds([]);
                }}
                title="Toggle Batch Edit Mode"
              >
                ✏️
              </button>
            )}
          </span>
        </div>

        <div className="stats-total">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>
          <div className="total-games-text">
            TOTAL COMPLETED GAMES: {games.length}
            {searchTerm && (
              <span className="found-count">(Found: {filteredGames.length})</span>
            )}
            {games.length > 0 && (
              <span
                className="stats-star"
                onClick={() => setShowStatsModal(true)}
                title="View more stats"
                style={{ marginLeft: "10px" }}
              >
                ⭐
              </span>
            )}
          </div>
          {isBatchMode && (
            <div className="batch-actions" style={{ flexDirection: 'row', gap: '10px' }}>
              <button
                className="delete-batch-btn"
                style={{ backgroundColor: '#2a475e', minWidth: 'auto', marginBottom: '0' }}
                onClick={fetchPlaytimeUpdates}
                disabled={isUpdatingBulk}
              >
                {isUpdatingBulk ? "FETCHING..." : "UPDATE PLAYTIMES OVERVIEW"}
              </button>
              {selectedSteamIds.length > 0 && (
                <button className="delete-batch-btn" style={{ minWidth: 'auto', marginTop: '0', marginBottom: '0' }} onClick={handleBulkDelete}>
                  DELETE SELECTED ({selectedSteamIds.length})
                </button>
              )}
            </div>
          )}
        </div>

        <div className="header-actions">
          {!isLoggedIn ? (
            <button className="login-btn" onClick={() => setShowLogin(true)}>
              SIGN IN
            </button>
          ) : (
            <>
              <button onClick={() => setShowAddModal(true)}>+ ADD GAME</button>
              <button className="login-btn" onClick={handleLogout}>
                LOGOUT
              </button>
            </>
          )}
        </div>
      </header>

      <div className="game-grid">
        {filteredGames.map((game) => (
          <div
            key={game.steam_id}
            className={`game-card 
              ${isCompleted(game) ? "completed" : ""} 
              ${isBatchMode ? "batch-mode" : ""} 
              ${selectedSteamIds.includes(game.steam_id) ? "selected" : ""}`}
            onClick={() => isBatchMode && toggleGameSelection(game.steam_id)}
          >
            {isLoggedIn && !isBatchMode && (
              <div className="game-actions">
                <button
                  className="action-btn edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(game);
                  }}
                  title="Edit Playtime"
                >
                  ✏️
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGame(game.steam_id);
                  }}
                  title="Delete Game"
                >
                  🗑️
                </button>
              </div>
            )}

            <div className="game-image">
              <img
                src={game.image_url}
                alt={game.name}
                style={{ width: "100%", display: "block" }}
              />
            </div>
            {isCompleted(game) && (
              <div className="medal-icon">🎖️</div>
            )}
            <div className="game-info">
              <div className="game-name" title={game.name}>
                {game.name}
              </div>
              <div className="game-details">
                <div>ID: {game.steam_id}</div>
                <div className="game-stats-row">
                  {game.total_achievements > 0 ? (
                    <div className="stat-group">
                      🏆 {game.achievement_count} / {game.total_achievements}
                    </div>
                  ) : (
                    <div></div> /* Spacer to keep playtime on the right */
                  )}
                  <div className="stat-group">
                    🕒 {game.playtime_hours}h {game.playtime_minutes}m
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Sign In</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  style={{ background: "#4e5b6b" }}
                >
                  Cancel
                </button>
                <button type="submit">Login</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Stats Modal */}
      {showStatsModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
              Player Statistics Overview
            </h2>
            <div className="stats-modal-grid">
              <div className="stat-item">
                <span className="stat-value">{stats.totalGames}</span>
                <span className="stat-label">Total Games</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.perfectGames}</span>
                <span className="stat-label">Perfect Games</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.totalAchievements}</span>
                <span className="stat-label">Total Achievements</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.playtime}</span>
                <span className="stat-label">Total Playtime</span>
              </div>
            </div>
            <div
              className="modal-actions"
              style={{ marginTop: "30px", justifyContent: "center" }}
            >
              <button onClick={closeModals}>Close Overview</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Game Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isEditing ? "Edit Game" : "Add Game"}</h2>
            {!isEditing && (
              <div className="form-group">
                <label>Steam ID</label>
                <div style={{ display: "flex", gap: "5px" }}>
                  <input
                    type="text"
                    value={newSteamId}
                    onChange={(e) => setNewSteamId(e.target.value)}
                    placeholder="e.g. 400"
                  />
                  <button onClick={handleFetchGameInfo} disabled={isFetching}>
                    {isFetching ? "..." : "Fetch"}
                  </button>
                </div>
              </div>
            )}

            {fetchedGame && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  background: "#101923",
                }}
              >
                {showOverwriteWarning && (
                  <div className="warning-text">
                    ⚠️ This game is already in your list! Saving will overwrite
                    it.
                  </div>
                )}
                <div style={{ fontWeight: "bold" }}>{fetchedGame.name}</div>
                {isEditing && fetchedGame.is_steam_playtime === 1 && (
                  <div style={{ marginTop: "10px" }}>
                    <button
                      onClick={updatePlaytime}
                      disabled={isFetching}
                      style={{ background: "#2a475e", fontSize: "0.8rem" }}
                    >
                      {isFetching ? "Updating..." : "🔄 Update Playtime from Steam"}
                    </button>
                  </div>
                )}
                {fetchedGame.total_achievements > 0 && (
                  <div>
                    Achievements: {fetchedGame.achievement_count} /{" "}
                    {fetchedGame.total_achievements}
                  </div>
                )}

                {fetchedGame.steam_playtime && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "8px",
                      border: "1px dashed var(--accent-color)",
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ fontSize: "0.9rem", marginBottom: "5px" }}>
                      🕒 Steam Playtime found:{" "}
                      <b>
                        {fetchedGame.steam_playtime.hours}h{" "}
                        {fetchedGame.steam_playtime.minutes}m
                      </b>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPlaytimeHours(fetchedGame.steam_playtime!.hours);
                        setPlaytimeMinutes(fetchedGame.steam_playtime!.minutes);
                      }}
                      style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                    >
                      Import Playtime
                    </button>
                  </div>
                )}

                <div className="form-group" style={{ marginTop: "10px" }}>
                  <label>Playtime Hours</label>
                  <input
                    type="number"
                    value={playtimeHours}
                    onChange={
                      setPlaytimeHours
                        ? (e) => setPlaytimeHours(parseInt(e.target.value) || 0)
                        : undefined
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Playtime Minutes</label>
                  <input
                    type="number"
                    value={playtimeMinutes}
                    onChange={
                      setPlaytimeMinutes
                        ? (e) =>
                          setPlaytimeMinutes(parseInt(e.target.value) || 0)
                        : undefined
                    }
                  />
                </div>

                <div className="modal-actions">
                  <button
                    onClick={closeModals}
                    style={{ background: "#4e5b6b" }}
                  >
                    Cancel
                  </button>
                  <button onClick={handleAddGame}>
                    {isEditing || showOverwriteWarning
                      ? "Overwrite"
                      : "Add to List"}
                  </button>
                </div>
              </div>
            )}

            {!fetchedGame && (
              <div className="modal-actions" style={{ marginTop: "20px" }}>
                <button onClick={closeModals} style={{ background: "#4e5b6b" }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Playtime Update Modal */}
      {showUpdatePlaytimeModal && (
        <div className="modal-overlay" onClick={() => setShowUpdatePlaytimeModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Playtime Updates Overview</h2>

            {playtimeUpdates.length === 0 ? (
              <p style={{ textAlign: "center", color: "#8f98a0" }}>All your Steam games are already up to date!</p>
            ) : (
              <div className="update-list">
                {playtimeUpdates.map(update => (
                  <div key={update.steam_id} className="update-item" onClick={() => toggleUpdateSelection(update.steam_id)}>
                    <input
                      type="checkbox"
                      checked={update.selected}
                      readOnly
                      style={{ cursor: "pointer", marginRight: "15px" }}
                    />
                    <div className="update-info">
                      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{update.name}</div>
                      <div className="diff-text">
                        <span>{update.currentHours}h {update.currentMinutes}m</span>
                        <span style={{ margin: "0 10px", color: "var(--accent-color)" }}>→</span>
                        <span style={{ color: "white" }}>{update.newHours}h {update.newMinutes}m</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: "30px", justifyContent: "flex-end", position: "sticky", bottom: "0", background: "var(--card-bg)" }}>
              <button
                style={{ background: "#4e5b6b" }}
                onClick={() => setShowUpdatePlaytimeModal(false)}
              >
                Cancel
              </button>
              {playtimeUpdates.length > 0 && (
                <button onClick={handleBulkPlaytimeUpdate}>
                  Confirm Selection
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
