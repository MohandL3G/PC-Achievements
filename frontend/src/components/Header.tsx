import { Search, Star, Pencil, LogIn, LogOut, Plus, RefreshCw, Trash2, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import avatarImg from "@/assets/avatar.jpg"

interface HeaderProps {
  isLoggedIn: boolean
  isBatchMode: boolean
  searchTerm: string
  sortType: string
  gamesCount: number
  filteredCount: number
  selectedCount: number
  isUpdatingBulk: boolean
  onSearchChange: (value: string) => void
  onSortChange: (value: string) => void
  onLoginClick: () => void
  onLogout: () => void
  onAddGameClick: () => void
  onStatsClick: () => void
  onToggleBatchMode: () => void
  onFetchPlaytimeUpdates: () => void
  onSyncAchievements: () => void
  onBulkDelete: () => void
}

export function Header({
  isLoggedIn,
  isBatchMode,
  searchTerm,
  sortType,
  gamesCount,
  filteredCount,
  selectedCount,
  isUpdatingBulk,
  onSearchChange,
  onSortChange,
  onLoginClick,
  onLogout,
  onAddGameClick,
  onStatsClick,
  onToggleBatchMode,
  onFetchPlaytimeUpdates,
  onSyncAchievements,
  onBulkDelete,
}: HeaderProps) {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] gap-5 border-b border-white/10 px-5 pb-5 pt-2">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full" onClick={onStatsClick} title="View Stats">
          <img src={avatarImg} alt="Profile" className="h-full w-full object-cover" />
        </div>
        <div className="group flex items-center gap-2">
          <span className="text-lg font-bold text-white">MohandL3G</span>
          {isLoggedIn && (
            <button
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm text-[#8f98a0] transition-colors hover:bg-white/10",
                isBatchMode && "bg-[#ff3e3e]/20 text-[#ff3e3e]",
              )}
              onClick={onToggleBatchMode}
              title="Toggle Batch Edit Mode"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f98a0]" />
            <Input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search games..."
              className="w-[280px] rounded-full border-[#ff3e3e]/30 bg-[#1a2432]/60 pl-9 text-white placeholder:text-[#8f98a0] focus:border-[#ff3e3e] focus:shadow-[0_0_8px_rgba(255,62,62,0.3)]"
            />
          </div>
          <Select value={sortType} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px] rounded-full border-[#323e4c] bg-[#1a2432]/60 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_added">Last Added</SelectItem>
              <SelectItem value="first_added">First Added</SelectItem>
              <SelectItem value="most_playtime">Most Playtime</SelectItem>
              <SelectItem value="least_playtime">Least Playtime</SelectItem>
              <SelectItem value="most_achievements">Most Achievements</SelectItem>
              <SelectItem value="least_achievements">Least Achievements</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 text-lg font-bold text-[#ff3e3e] [text-shadow:0_0_10px_rgba(255,62,62,0.5)]">
          <span>
            TOTAL COMPLETED GAMES: {gamesCount}
            {searchTerm && <span className="ml-1 text-xs text-[#8f98a0]">(Found: {filteredCount})</span>}
          </span>
          {gamesCount > 0 && (
            <Star
              className="ml-2 h-5 w-5 cursor-pointer text-[#ff3e3e] transition-all hover:scale-110 hover:[text-shadow:0_0_15px_rgba(255,62,62,0.8)]"
              onClick={onStatsClick}
            />
          )}
        </div>

        {isBatchMode && (
          <div className="flex gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={onFetchPlaytimeUpdates}
              disabled={isUpdatingBulk}
              className="bg-[#2a475e] text-white hover:bg-[#2a475e]/80"
            >
              {isUpdatingBulk ? (
                <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="mr-1 h-4 w-4" />
              )}
              {isUpdatingBulk ? "FETCHING..." : "UPDATE PLAYTIMES"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onSyncAchievements}
              className="bg-[#2a475e] text-white hover:bg-[#2a475e]/80"
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              SYNC ACHIEVEMENTS
            </Button>
            {selectedCount > 0 && (
              <Button variant="destructive" size="sm" onClick={onBulkDelete}>
                <Trash2 className="mr-1 h-4 w-4" />
                DELETE ({selectedCount})
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        {!isLoggedIn ? (
          <Button variant="outline" onClick={onLoginClick}>
            <LogIn className="mr-1 h-4 w-4" />
            SIGN IN
          </Button>
        ) : (
          <>
            <Button onClick={onAddGameClick}>
              <Plus className="mr-1 h-4 w-4" />
              ADD GAME
            </Button>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="mr-1 h-4 w-4" />
              LOGOUT
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
