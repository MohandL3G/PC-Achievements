import { useState, useCallback } from "react"
import { api } from "@/api/client"
import type { GameAchievement } from "@/types"

export function useAchievements() {
  const [achievements, setAchievements] = useState<GameAchievement[]>([])
  const [loading, setLoading] = useState(false)
  const [rareCount, setRareCount] = useState(0)

  const fetchAchievements = useCallback(async (steamId: string) => {
    setLoading(true)
    try {
      const res = await api.get<GameAchievement[]>(`/games/${steamId}/achievements`)
      setAchievements(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRareCount = useCallback(async () => {
    const res = await api.get<{ rareAchievements: number }>("/stats")
    setRareCount(res.data.rareAchievements)
  }, [])

  return { achievements, loading, rareCount, fetchAchievements, fetchRareCount }
}
