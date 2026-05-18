import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface StatsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalGames: number
  totalAchievements: number
  rareAchievements: number
  totalPlaytime: string
  perfectGames: number
}

export function StatsModal({ open, onOpenChange, totalGames, totalAchievements, rareAchievements, totalPlaytime, perfectGames }: StatsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center">Player Statistics Overview</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center rounded-lg bg-[#101923] p-3.5">
            <span className="text-2xl font-bold text-[#ff3e3e]">{totalGames}</span>
            <span className="text-xs uppercase tracking-wider text-[#8f98a0]">Total Games</span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-[#101923] p-3.5">
            <span className="text-2xl font-bold text-[#ff3e3e]">{rareAchievements}</span>
            <span className="text-xs uppercase tracking-wider text-[#8f98a0]">Rare Achievements</span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-[#101923] p-3.5">
            <span className="text-2xl font-bold text-[#ff3e3e]">{totalAchievements}</span>
            <span className="text-xs uppercase tracking-wider text-[#8f98a0]">Total Achievements</span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-[#101923] p-3.5">
            <span className="text-2xl font-bold text-[#ff3e3e]">{totalPlaytime}</span>
            <span className="text-xs uppercase tracking-wider text-[#8f98a0]">Total Playtime</span>
          </div>
        </div>
        {perfectGames > 0 && (
          <p className="text-center text-sm text-[#8f98a0]">
            Perfect games: <span className="font-bold text-[#ffc107]">{perfectGames}</span>
          </p>
        )}
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close Overview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
