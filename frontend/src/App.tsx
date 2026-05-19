import { useState, useEffect, useCallback } from "react"
import { Toaster, toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useGames } from "@/hooks/useGames"
import { useAchievements } from "@/hooks/useAchievements"
import { Header } from "@/components/Header"
import { GameCard } from "@/components/GameCard"
import { LoginModal } from "@/components/LoginModal"
import { AddGameModal } from "@/components/AddGameModal"
import { StatsModal } from "@/components/StatsModal"
import { GameDetailsModal } from "@/components/GameDetailsModal"
import { BulkPlaytimeModal } from "@/components/BulkPlaytimeModal"
import type { Game, PlaytimeUpdate } from "@/types"

function App() {
  const { token, isLoggedIn, login, logout } = useAuth()
  const { games, loading, fetchGames, deleteGame, bulkDelete, fetchSteamPlaytimes, bulkUpdatePlaytimes, syncAchievements } = useGames()
  const { rareCount, fetchRareCount } = useAchievements()

  const [showLogin, setShowLogin] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [selectedSteamIds, setSelectedSteamIds] = useState<string[]>([])
  const [showUpdatePlaytimeModal, setShowUpdatePlaytimeModal] = useState(false)
  const [playtimeUpdates, setPlaytimeUpdates] = useState<PlaytimeUpdate[]>([])
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortType, setSortType] = useState("last_added")
  const [selectedGameToView, setSelectedGameToView] = useState<Game | null>(null)
const [gameToEdit, setGameToEdit] = useState<Game | null>(null)

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  useEffect(() => {
    document.body.style.overflow = selectedGameToView || showUpdatePlaytimeModal || showAddModal || showStatsModal || showLogin ? "hidden" : "unset"
    return () => { document.body.style.overflow = "unset" }
  }, [selectedGameToView, showUpdatePlaytimeModal, showAddModal, showStatsModal, showLogin])

  const handleLogin = useCallback(async (username: string, password: string) => {
    await login(username, password)
    toast.success("Logged in successfully")
  }, [login])

  const handleLogout = useCallback(() => {
    logout()
    setIsBatchMode(false)
    setSelectedSteamIds([])
    toast.info("Logged out")
  }, [logout])

  const handleDeleteGame = useCallback(async (steamId: string) => {
    if (!token) return
    try {
      await deleteGame(steamId, token)
      fetchGames()
      toast.success("Game deleted")
    } catch {
      toast.error("Failed to delete game")
    }
  }, [token, deleteGame, fetchGames])

  const handleBulkDelete = useCallback(async () => {
    if (!token || selectedSteamIds.length === 0) return
    try {
      await bulkDelete(selectedSteamIds, token)
      setSelectedSteamIds([])
      setIsBatchMode(false)
      fetchGames()
      toast.success(`${selectedSteamIds.length} games deleted`)
    } catch {
      toast.error("Failed to bulk delete")
    }
  }, [token, selectedSteamIds, bulkDelete, fetchGames])

  const handleFetchPlaytimeUpdates = useCallback(async () => {
    if (!token) return
    setIsUpdatingBulk(true)
    try {
      const steamPlaytimes = await fetchSteamPlaytimes()
      const updatesList: PlaytimeUpdate[] = []
      games.forEach((game) => {
        if (game.is_steam_playtime === 1) {
          const fetched = steamPlaytimes[game.steam_id]
          if (fetched && (game.playtime_hours !== fetched.hours || game.playtime_minutes !== fetched.minutes)) {
            updatesList.push({
              steam_id: game.steam_id,
              name: game.name,
              currentHours: game.playtime_hours,
              currentMinutes: game.playtime_minutes,
              newHours: fetched.hours,
              newMinutes: fetched.minutes,
              selected: true,
            })
          }
        }
      })
      setPlaytimeUpdates(updatesList)
      setShowUpdatePlaytimeModal(true)
    } catch {
      toast.error("Failed to fetch Steam playtimes")
    } finally {
      setIsUpdatingBulk(false)
    }
  }, [token, games, fetchSteamPlaytimes])

  const handleBulkPlaytimeUpdate = useCallback(async () => {
    const selected = playtimeUpdates.filter((u) => u.selected).map((u) => ({
      steam_id: u.steam_id,
      playtime_hours: u.newHours,
      playtime_minutes: u.newMinutes,
    }))
    if (selected.length === 0) {
      setShowUpdatePlaytimeModal(false)
      return
    }
    try {
      await bulkUpdatePlaytimes(selected, token!)
      setShowUpdatePlaytimeModal(false)
      fetchGames()
      toast.success("Playtimes updated")
    } catch {
      toast.error("Failed to bulk update playtimes")
    }
  }, [playtimeUpdates, bulkUpdatePlaytimes, token, fetchGames])

  const handleSyncAchievements = useCallback(async () => {
    if (!token) return
    try {
      const msg = await syncAchievements(token)
      toast.success(msg)
    } catch {
      toast.error("Failed to sync achievements")
    }
  }, [token, syncAchievements])

  const toggleGameSelection = useCallback((steamId: string) => {
    setSelectedSteamIds((prev) =>
      prev.includes(steamId) ? prev.filter((id) => id !== steamId) : [...prev, steamId],
    )
  }, [])

  const toggleUpdateSelection = useCallback((steamId: string) => {
    setPlaytimeUpdates((prev) =>
      prev.map((u) => (u.steam_id === steamId ? { ...u, selected: !u.selected } : u)),
    )
  }, [])

  const filteredGames = games.filter(
    (g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()) || g.steam_id.includes(searchTerm),
  )

  const displayedGames = [...filteredGames]
  if (sortType === "first_added") {
    displayedGames.reverse()
  } else if (sortType !== "last_added") {
    displayedGames.sort((a, b) => {
      if (sortType === "most_achievements") return b.achievement_count - a.achievement_count
      if (sortType === "least_achievements") return a.achievement_count - b.achievement_count
      const pa = a.playtime_hours * 60 + a.playtime_minutes
      const pb = b.playtime_hours * 60 + b.playtime_minutes
      if (sortType === "most_playtime") return pb - pa
      if (sortType === "least_playtime") return pa - pb
      return 0
    })
  }

  const stats = (() => {
    const totalAchievements = games.reduce((acc, g) => acc + g.achievement_count, 0)
    const totalMinutes = games.reduce((acc, g) => acc + g.playtime_hours * 60 + g.playtime_minutes, 0)
    return {
      totalGames: games.length,
      totalAchievements,
      playtime: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      perfectGames: games.filter((g) => g.achievement_count === g.total_achievements || g.total_achievements === 0).length,
    }
  })()

  return (
    <div className="bg-background bg-[radial-gradient(circle_at_50%_-20%,rgba(255,62,62,0.15),transparent_60%),radial-gradient(circle_at_0%_0%,rgba(255,62,62,0.03),transparent_40%),radial-gradient(circle_at_100%_100%,rgba(255,62,62,0.03),transparent_40%),linear-gradient(180deg,#0f1722_0%,#070a0f_100%)] bg-fixed text-foreground font-sans min-h-screen">
      <Toaster position="bottom-right" theme="dark" richColors closeButton />

      <div className="mx-auto max-w-[1600px] px-5">
        <Header
          isLoggedIn={isLoggedIn}
          isBatchMode={isBatchMode}
          searchTerm={searchTerm}
          sortType={sortType}
          gamesCount={games.length}
          filteredCount={filteredGames.length}
          selectedCount={selectedSteamIds.length}
          isUpdatingBulk={isUpdatingBulk}
          onSearchChange={setSearchTerm}
          onSortChange={setSortType}
          onLoginClick={() => setShowLogin(true)}
          onLogout={handleLogout}
          onAddGameClick={() => setShowAddModal(true)}
          onStatsClick={() => { fetchRareCount(); setShowStatsModal(true) }}
          onToggleBatchMode={() => { setIsBatchMode(!isBatchMode); setSelectedSteamIds([]) }}
          onFetchPlaytimeUpdates={handleFetchPlaytimeUpdates}
          onSyncAchievements={handleSyncAchievements}
          onBulkDelete={handleBulkDelete}
        />

        {loading && games.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="flex items-center gap-3 text-lg text-[#8f98a0]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#ff3e3e] border-t-transparent" />
              Loading games...
            </div>
          </div>
        ) : displayedGames.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-5 py-5">
            {displayedGames.map((game) => (
              <GameCard
                key={game.steam_id}
                game={game}
                isBatchMode={isBatchMode}
                isSelected={selectedSteamIds.includes(game.steam_id)}
                onToggleSelect={toggleGameSelection}
                onClick={(g) => setSelectedGameToView(g)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-[#8f98a0]">
            <p className="text-lg">{searchTerm ? "No games match your search." : "No games yet."}</p>
            {!searchTerm && isLoggedIn && (
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-md bg-[#ff3e3e] px-4 py-2 text-white transition-colors hover:bg-[#ff3e3e]/80"
              >
                + Add your first game
              </button>
            )}
          </div>
        )}
      </div>

      <LoginModal open={showLogin} onOpenChange={setShowLogin} onLogin={handleLogin} />
      <AddGameModal open={showAddModal} onOpenChange={(open) => { setShowAddModal(open); if (!open) setGameToEdit(null) }} games={games} token={token} onGameAdded={fetchGames} gameToEdit={gameToEdit} />
      <StatsModal
        open={showStatsModal}
        onOpenChange={setShowStatsModal}
        totalGames={stats.totalGames}
        totalAchievements={stats.totalAchievements}
        rareAchievements={rareCount}
        totalPlaytime={stats.playtime}
        perfectGames={stats.perfectGames}
      />
      <GameDetailsModal
        game={selectedGameToView}
        open={!!selectedGameToView}
        onOpenChange={(open) => { if (!open) setSelectedGameToView(null) }}
        onEdit={(game) => {
          setSelectedGameToView(null)
          setGameToEdit(game)
          setShowAddModal(true)
        }}
        onDelete={handleDeleteGame}
        token={token}
      />
      <BulkPlaytimeModal
        open={showUpdatePlaytimeModal}
        onOpenChange={setShowUpdatePlaytimeModal}
        updates={playtimeUpdates}
        onToggleUpdate={toggleUpdateSelection}
        onConfirm={handleBulkPlaytimeUpdate}
      />
    </div>
  )
}

export default App
