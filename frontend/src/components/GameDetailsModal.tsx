import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/api/client"
import type { Game, GameAchievement } from "@/types"
import { Clock, Pencil, Trash2, Trophy } from "lucide-react"

interface GameDetailsModalProps {
  game: Game | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (game: Game) => void
  onDelete: (steamId: string) => void
  token: string | null
}

export function GameDetailsModal({ game, open, onOpenChange, onEdit, onDelete, token }: GameDetailsModalProps) {
  const [achievements, setAchievements] = useState<GameAchievement[]>([])
  const [loading, setLoading] = useState(false)
  const [sortDesc, setSortDesc] = useState(true)
  const prevOpen = useRef(open)

  useEffect(() => {
    if (open && !prevOpen.current && game) {
      setAchievements([])
      setLoading(true)
      api
        .get<GameAchievement[]>(`/games/${game.steam_id}/achievements`)
        .then((res) => setAchievements(res.data))
        .finally(() => setLoading(false))
    }
    prevOpen.current = open
  }, [open, game])

  if (!game) return null

  const sorted = [...achievements].sort((a, b) => (sortDesc ? b.rarity - a.rarity : a.rarity - b.rarity))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] gap-0 p-0">
        <div
          className="relative flex h-[220px] items-end bg-cover bg-center"
          style={{ backgroundImage: `url(${game.image_url})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="relative z-10 p-5">
            <DialogHeader>
              <h2 className="text-2xl font-bold text-white">{game.name}</h2>
            </DialogHeader>
            <div className="flex items-center gap-1 text-white/80">
              <Clock className="h-4 w-4" />
              <span>
                {game.playtime_hours}h {game.playtime_minutes}m
              </span>
            </div>
          </div>
        </div>

        {token && (
          <div className="flex gap-2 border-b border-[#1a2432] p-3">
            <Button
              variant="secondary"
              className="flex-1 bg-[#2a475e] text-white hover:bg-[#2a475e]/80"
              onClick={() => {
                onOpenChange(false)
                onEdit(game)
              }}
            >
              <Pencil className="mr-1 h-4 w-4" />
              Edit Playtime
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                onDelete(game.steam_id)
                onOpenChange(false)
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete Game
            </Button>
          </div>
        )}

        <div className="border-b border-[#1a2432] bg-black/20 px-5 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8f98a0]">Achievements</span>
            <Badge
              variant="outline"
              className="cursor-pointer border-[#323e4c] text-xs text-[#8f98a0]"
              onClick={() => setSortDesc(!sortDesc)}
            >
              Sort: {sortDesc ? "Common \u2192 Rare" : "Rare \u2192 Common"}
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-[58px] w-[58px] rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length > 0 ? (
          <ScrollArea className="max-h-[450px]">
            <div className="space-y-0">
              {sorted.map((ach) => (
                <div
                  key={ach.api_name}
                  className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-[rgba(255,62,62,0.08)]"
                >
                  <img
                    src={ach.icon_url}
                    alt={ach.display_name}
                    className="h-[58px] w-[58px] rounded object-cover shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-bold text-white">{ach.display_name}</div>
                    <div className="truncate text-sm text-[#8f98a0]">{ach.description}</div>
                  </div>
                  <Badge className="shrink-0 bg-[rgba(229,160,13,0.15)] text-sm font-bold text-[#ffc107] hover:bg-[rgba(229,160,13,0.15)]">
                    {ach.rarity.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-10 text-center text-[#8f98a0]">
            <Trophy className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>No Steam Achievements available for this title.</p>
          </div>
        )}

        <div className="flex justify-center p-3">
          <Button variant="secondary" className="w-full" onClick={() => onOpenChange(false)}>
            Close Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
