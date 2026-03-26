import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

interface Game {
  id?: number;
  steam_id: string;
  name: string;
  playtime_hours: number;
  playtime_minutes: number;
  achievement_count: number;
  total_achievements: number;
  image_url: string;
  steam_playtime?: {
    hours: number;
    minutes: number;
  } | null;
}

const API_BASE = '/api';

function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Add/Edit game state
  const [newSteamId, setNewSteamId] = useState('');
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
      console.error('Error fetching games', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/login`, { username, password });
      const newToken = res.data.accessToken;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setIsLoggedIn(true);
      setShowLogin(false);
    } catch (err) {
      alert('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  const handleFetchGameInfo = async () => {
    if (!newSteamId) return;
    setIsFetching(true);
    try {
      const res = await axios.get(`${API_BASE}/steam/game/${newSteamId}`);
      const gameData = {
        ...res.data,
        playtime_hours: 0,
        playtime_minutes: 0
      };
      
      setFetchedGame(gameData);
      
      // Check if game already exists
      const exists = games.find(g => g.steam_id === newSteamId);
      if (exists) {
        setShowOverwriteWarning(true);
        setPlaytimeHours(exists.playtime_hours);
        setPlaytimeMinutes(exists.playtime_minutes);
      } else {
        setShowOverwriteWarning(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to fetch game data');
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
        playtime_minutes: playtimeMinutes
      };
      await axios.post(`${API_BASE}/games`, gameData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      closeModals();
      fetchGames();
    } catch (err) {
      alert('Failed to add/update game');
    }
  };

  const handleDeleteGame = async (steamId: string) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    
    try {
      await axios.delete(`${API_BASE}/games/${steamId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGames();
    } catch (err) {
      alert('Failed to delete game');
    }
  };

  const handleEditClick = (game: Game) => {
    setFetchedGame(game);
    setNewSteamId(game.steam_id);
    setPlaytimeHours(game.playtime_hours);
    setPlaytimeMinutes(game.playtime_minutes);
    setIsEditing(true);
    setShowAddModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setFetchedGame(null);
    setNewSteamId('');
    setPlaytimeHours(0);
    setPlaytimeMinutes(0);
    setIsEditing(false);
    setShowOverwriteWarning(false);
  };

  return (
    <div className="container">
      <header>
        <div className="stats-total">
          TOTAL COMPLETED GAMES: {games.length}
        </div>
        <div className="header-actions">
          {!isLoggedIn ? (
            <button className="login-btn" onClick={() => setShowLogin(true)}>SIGN IN</button>
          ) : (
            <>
              <button onClick={() => setShowAddModal(true)}>+ ADD GAME</button>
              <button className="login-btn" onClick={handleLogout}>LOGOUT</button>
            </>
          )}
        </div>
      </header>

      <div className="game-grid">
        {games.map(game => (
          <div key={game.steam_id} className={`game-card ${game.achievement_count === game.total_achievements && game.total_achievements > 0 ? 'completed' : ''}`}>
            {isLoggedIn && (
              <div className="game-actions">
                <button className="action-btn edit-btn" onClick={() => handleEditClick(game)}>EDIT</button>
                <button className="action-btn delete-btn" onClick={() => handleDeleteGame(game.steam_id)}>DELETE</button>
              </div>
            )}
            
            <div className="game-image">
              <img src={game.image_url} alt={game.name} style={{width: '100%', display: 'block'}} />
              {game.achievement_count === game.total_achievements && game.total_achievements > 0 && (
                <div className="medal-icon">🎖️</div>
              )}
            </div>
            <div className="game-info">
              <div className="game-name" title={game.name}>{game.name}</div>
              <div className="game-details">
                <div>ID: {game.steam_id}</div>
                <div>🏆 {game.achievement_count} / {game.total_achievements}</div>
                <div>🕒 {game.playtime_hours}h {game.playtime_minutes}m</div>
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
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowLogin(false)} style={{background: '#4e5b6b'}}>Cancel</button>
                <button type="submit">Login</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Game Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isEditing ? 'Edit Game' : 'Add Game'}</h2>
            {!isEditing && (
              <div className="form-group">
                <label>Steam ID</label>
                <div style={{display: 'flex', gap: '5px'}}>
                  <input type="text" value={newSteamId} onChange={e => setNewSteamId(e.target.value)} placeholder="e.g. 400" />
                  <button onClick={handleFetchGameInfo} disabled={isFetching}>
                    {isFetching ? '...' : 'Fetch'}
                  </button>
                </div>
              </div>
            )}

            {fetchedGame && (
              <div style={{marginTop: '15px', padding: '10px', background: '#101923'}}>
                {showOverwriteWarning && (
                  <div className="warning-text">⚠️ This game is already in your list! Saving will overwrite it.</div>
                )}
                <div style={{fontWeight: 'bold'}}>{fetchedGame.name}</div>
                <div>Achievements: {fetchedGame.achievement_count} / {fetchedGame.total_achievements}</div>
                
                {fetchedGame.steam_playtime && (
                  <div style={{marginTop: '10px', padding: '8px', border: '1px dashed var(--accent-color)', borderRadius: '4px'}}>
                    <div style={{fontSize: '0.9rem', marginBottom: '5px'}}>🕒 Steam Playtime found: <b>{fetchedGame.steam_playtime.hours}h {fetchedGame.steam_playtime.minutes}m</b></div>
                    <button type="button" onClick={() => {
                      setPlaytimeHours(fetchedGame.steam_playtime!.hours);
                      setPlaytimeMinutes(fetchedGame.steam_playtime!.minutes);
                    }} style={{fontSize: '0.75rem', padding: '4px 8px'}}>Import Playtime</button>
                  </div>
                )}
                
                <div className="form-group" style={{marginTop: '10px'}}>
                  <label>Playtime Hours</label>
                  <input type="number" value={playtimeHours} onChange={e => setPlaytimeHours(parseInt(e.target.value) || 0)} />
                </div>
                <div className="form-group">
                  <label>Playtime Minutes</label>
                  <input type="number" value={playtimeMinutes} onChange={e => setPlaytimeMinutes(parseInt(e.target.value) || 0)} />
                </div>
                
                <div className="modal-actions">
                  <button onClick={closeModals} style={{background: '#4e5b6b'}}>Cancel</button>
                  <button onClick={handleAddGame}>{isEditing || showOverwriteWarning ? 'Overwrite' : 'Add to List'}</button>
                </div>
              </div>
            )}

            {!fetchedGame && (
              <div className="modal-actions" style={{marginTop: '20px'}}>
                <button onClick={closeModals} style={{background: '#4e5b6b'}}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
