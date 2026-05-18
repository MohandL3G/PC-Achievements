import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { PlaytimeUpdate } from "@/types"
import { ArrowRight } from "lucide-react"

interface BulkPlaytimeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  updates: PlaytimeUpdate[]
  onToggleUpdate: (steamId: string) => void
  onConfirm: () => void
}

export function BulkPlaytimeModal({ open, onOpenChange, updates, onToggleUpdate, onConfirm }: BulkPlaytimeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Playtime Updates Overview</DialogTitle>
        </DialogHeader>

        {updates.length === 0 ? (
          <p className="text-center text-[#8f98a0]">All your Steam games are already up to date!</p>
        ) : (
          <div className="space-y-2">
            {updates.map((update) => (
              <div
                key={update.steam_id}
                className="flex cursor-pointer items-center gap-4 rounded-md bg-[#101923] p-3 transition-colors hover:bg-[#101923]/80"
                onClick={() => onToggleUpdate(update.steam_id)}
              >
                <input type="checkbox" checked={update.selected} readOnly className="cursor-pointer accent-[#ff3e3e]" />
                <div className="flex-1">
                  <div className="mb-1 font-bold">{update.name}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>
                      {update.currentHours}h {update.currentMinutes}m
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#ff3e3e]" />
                    <span className="text-white">
                      {update.newHours}h {update.newMinutes}m
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="sticky bottom-0 flex justify-end gap-2 bg-[#1a2432] pt-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {updates.length > 0 && <Button onClick={onConfirm}>Confirm Selection</Button>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
