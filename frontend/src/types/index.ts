export interface Game {
  id?: number
  steam_id: string
  name: string
  playtime_hours: number
  playtime_minutes: number
  achievement_count: number
  total_achievements: number
  image_url: string
  is_steam_playtime?: number
  is_owned?: number
  date_added?: string | null
  steam_playtime?: {
    hours: number
    minutes: number
  } | null
}

export interface GameAchievement {
  steam_id: string
  api_name: string
  display_name: string
  description: string
  icon_url: string
  rarity: number
}

export interface PlaytimeUpdate {
  steam_id: string
  name: string
  currentHours: number
  currentMinutes: number
  newHours: number
  newMinutes: number
  selected: boolean
}

export interface SteamPlaytime {
  hours: number
  minutes: number
}
