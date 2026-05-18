import type { Game } from "@/types"
import { Trophy, Clock, Medal, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface GameCardProps {
  game: Game
  isBatchMode: boolean
  isSelected: boolean
  onToggleSelect: (steamId: string) => void
  onClick: (game: Game) => void
}

export function GameCard({ game, isBatchMode, isSelected, onToggleSelect, onClick }: GameCardProps) {
  const completed = game.achievement_count === game.total_achievements || game.total_achievements === 0

  return (
    <div
      className={cn(
        "group relative w-[calc(20%-20px)] min-w-[180px] flex-shrink-0 cursor-pointer overflow-hidden rounded-md border-2 border-transparent bg-[#1a2432] transition-all duration-200 hover:scale-[1.02]",
        completed && "border-[#ffc107] shadow-[0_0_15px_rgba(229,160,13,0.3)]",
        isBatchMode && "cursor-pointer",
        isSelected && "scale-[1.05] border-white shadow-[0_0_15px_rgba(255,62,62,0.5)]",
      )}
      onClick={() => (isBatchMode ? onToggleSelect(game.steam_id) : onClick(game))}
    >
      <div className="aspect-video w-full overflow-hidden">
        <img src={game.image_url} alt={game.name} className="block w-full object-cover" loading="lazy" />
        {isBatchMode && (
          <div className="absolute top-2 left-2 z-10">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/60 transition-colors",
                isSelected && "border-white bg-white",
              )}
            >
              {isSelected && <Check className="h-4 w-4 text-black" />}
            </div>
          </div>
        )}
      </div>

      {completed && (
        <div className="absolute top-2 right-2">
          <Medal className="h-6 w-6 text-yellow-500 drop-shadow-md" />
        </div>
      )}

      <div className="space-y-1 p-2.5">
        <div className="truncate text-base font-bold text-white" title={game.name}>
          {game.name}
        </div>
        <div className="space-y-1 text-xs text-[#8f98a0]">
          <div>ID: {game.steam_id}</div>
          <div className="flex items-center justify-between gap-2">
            {game.total_achievements > 0 ? (
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                <span>
                  {game.achievement_count}/{game.total_achievements}
                </span>
              </div>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {game.playtime_hours}h {game.playtime_minutes}m
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
