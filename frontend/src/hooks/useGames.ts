import { useState, useCallback } from "react"
import { api } from "@/api/client"
import type { Game, SteamPlaytime } from "@/types"

export function useGames() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)

  const fetchGames = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get("/games")
      setGames(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  const addGame = useCallback(async (game: Game, token: string) => {
    await api.post("/games", game, {
      headers: { Authorization: `Bearer ${token}` },
    })
  }, [])

  const deleteGame = useCallback(async (steamId: string, token: string) => {
    await api.delete(`/games/${steamId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  }, [])

  const bulkDelete = useCallback(async (steamIds: string[], token: string) => {
    await api.post(
      "/games/bulk-delete",
      { steam_ids: steamIds },
      { headers: { Authorization: `Bearer ${token}` } },
    )
  }, [])

  const fetchSteamPlaytimes = useCallback(async () => {
    const res = await api.get<Record<string, SteamPlaytime>>("/steam/playtimes")
    return res.data
  }, [])

  const bulkUpdatePlaytimes = useCallback(
    async (updates: { steam_id: string; playtime_hours: number; playtime_minutes: number }[], token: string) => {
      await api.put(
        "/games/bulk-update-playtime",
        { updates },
        { headers: { Authorization: `Bearer ${token}` } },
      )
    },
    [],
  )

  const syncAchievements = useCallback(async (token: string) => {
    const res = await api.post(
      "/games/sync-achievements",
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    )
    return res.data.message as string
  }, [])

  return {
    games,
    loading,
    fetchGames,
    addGame,
    deleteGame,
    bulkDelete,
    fetchSteamPlaytimes,
    bulkUpdatePlaytimes,
    syncAchievements,
  }
}
