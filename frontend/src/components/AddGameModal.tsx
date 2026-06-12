import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/api/client"
import type { Game } from "@/types"
import { RefreshCw, Download, Clock } from "lucide-react"

interface AddGameModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  games: Game[]
  token: string | null
  onGameAdded: () => void
  gameToEdit?: Game | null
}

export function AddGameModal({ open, onOpenChange, games, token, onGameAdded, gameToEdit }: AddGameModalProps) {
  const [newSteamId, setNewSteamId] = useState(gameToEdit?.steam_id ?? "")
  const [fetchedGame, setFetchedGame] = useState<Game | null>(gameToEdit ?? null)
  const [playtimeHours, setPlaytimeHours] = useState(gameToEdit?.playtime_hours ?? 0)
  const [playtimeMinutes, setPlaytimeMinutes] = useState(gameToEdit?.playtime_minutes ?? 0)
  const [isFetching, setIsFetching] = useState(false)
  const [decimalHours, setDecimalHours] = useState("")
  const [playtimeMode, setPlaytimeMode] = useState<"hms" | "decimal">("hms")
  const isEditing = !!gameToEdit

  const handleFetchGameInfo = async () => {
    if (!newSteamId) return
    const exists = games.find((g) => g.steam_id === newSteamId)
    if (exists && !fetchedGame) {
      setFetchedGame(exists)
      setPlaytimeHours(exists.playtime_hours)
      setPlaytimeMinutes(exists.playtime_minutes)
      return
    }

    setIsFetching(true)
    try {
      const res = await api.get(`/steam/game/${newSteamId}`)
      const { steam_playtime } = res.data
      setFetchedGame({
        ...res.data,
        is_owned: 1,
        playtime_hours: steam_playtime?.hours ?? 0,
        playtime_minutes: steam_playtime?.minutes ?? 0,
      })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      alert(axiosErr.response?.data?.error || "Failed to fetch game data")
    } finally {
      setIsFetching(false)
    }
  }

  const handleAddGame = async () => {
    if (!fetchedGame || !token) return
    let hours = playtimeHours
    let minutes = playtimeMinutes
    if (playtimeMode === "decimal") {
      const dec = parseFloat(decimalHours) || 0
      hours = Math.floor(dec)
      minutes = Math.round((dec - hours) * 60)
    }
    try {
      const gameData = {
        ...fetchedGame,
        playtime_hours: hours,
        playtime_minutes: minutes,
        is_steam_playtime:
          fetchedGame.steam_playtime &&
          hours === fetchedGame.steam_playtime.hours &&
          minutes === fetchedGame.steam_playtime.minutes
            ? 1
            : 0,
      }
      await api.post("/games", gameData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      onOpenChange(false)
      onGameAdded()
    } catch {
      alert("Failed to add/update game")
    }
  }

  const updatePlaytimeFromSteam = async () => {
    if (!fetchedGame) return
    setIsFetching(true)
    try {
      const res = await api.get(`/steam/game/${fetchedGame.steam_id}`)
      setFetchedGame((prev) => prev ? { ...prev, is_owned: 1 } : prev)
      if (res.data.steam_playtime) {
        setPlaytimeHours(res.data.steam_playtime.hours)
        setPlaytimeMinutes(res.data.steam_playtime.minutes)
      } else {
        alert("No Steam playtime found for this game.")
      }
    } catch {
      alert("Failed to fetch updated playtime from Steam.")
    } finally {
      setIsFetching(false)
    }
  }

  const togglePlaytimeMode = () => {
    if (playtimeMode === "hms") {
      const total = playtimeHours + playtimeMinutes / 60
      setDecimalHours(total > 0 ? total.toFixed(1) : "")
      setPlaytimeMode("decimal")
    } else {
      const dec = parseFloat(decimalHours) || 0
      setPlaytimeHours(Math.floor(dec))
      setPlaytimeMinutes(Math.round((dec - Math.floor(dec)) * 60))
      setPlaytimeMode("hms")
    }
  }

  return (
    <Dialog
      key={gameToEdit?.steam_id ?? "add-game"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Game" : "Add Game"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!isEditing && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Steam ID</label>
              <div className="flex gap-1.5">
                <Input
                  value={newSteamId}
                  onChange={(e) => setNewSteamId(e.target.value)}
                  placeholder="e.g. 400"
                />
                <Button onClick={handleFetchGameInfo} disabled={isFetching} variant="secondary">
                  {isFetching ? "..." : "Fetch"}
                </Button>
              </div>
            </div>
          )}

          {fetchedGame && (
            <div className="space-y-3 rounded-md bg-[#101923] p-2.5">
              <div className="font-bold">{fetchedGame.name}</div>

              {isEditing && (
                <Button onClick={updatePlaytimeFromSteam} disabled={isFetching} variant="secondary" className="w-full text-sm">
                  <RefreshCw className="mr-1 h-4 w-4" />
                  {isFetching ? "Updating..." : "Update Playtime from Steam"}
                </Button>
              )}

              {fetchedGame.total_achievements > 0 && (
                <div>
                  Achievements: {fetchedGame.achievement_count} / {fetchedGame.total_achievements}
                </div>
              )}

              {fetchedGame.steam_playtime && (
                <div className="rounded border border-dashed border-[#ff3e3e] p-2">
                  <div className="mb-1 text-sm">
                    Steam Playtime found: <b>{fetchedGame.steam_playtime.hours}h {fetchedGame.steam_playtime.minutes}m</b>
                  </div>
                  <Button
                    onClick={() => {
                      setPlaytimeHours(fetchedGame.steam_playtime!.hours)
                      setPlaytimeMinutes(fetchedGame.steam_playtime!.minutes)
                    }}
                    variant="secondary"
                    className="text-xs"
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Import Playtime
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Playtime</label>
                <button
                  type="button"
                  onClick={togglePlaytimeMode}
                  className="flex items-center gap-1 text-xs text-[#8f98a0] transition-colors hover:text-white"
                >
                  <Clock className="h-3 w-3" />
                  {playtimeMode === "hms" ? "Switch to Decimal" : "Switch to Hours:Minutes"}
                </button>
              </div>

              {playtimeMode === "hms" ? (
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs text-[#8f98a0]">Hours</label>
                    <Input
                      type="number"
                      value={playtimeHours}
                      onChange={(e) => setPlaytimeHours(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs text-[#8f98a0]">Minutes</label>
                    <Input
                      type="number"
                      value={playtimeMinutes}
                      onChange={(e) => setPlaytimeMinutes(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs text-[#8f98a0]">Decimal Hours</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={decimalHours}
                    onChange={(e) => setDecimalHours(e.target.value)}
                    placeholder="e.g. 10.3"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddGame}>
                  {isEditing ? "Overwrite" : "Add to List"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
