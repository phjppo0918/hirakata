import type { Question, ScriptMode } from './lib/kana'

export type TripKind = 'trip' | 'express'

export interface TripConfig {
  mode: ScriptMode
  stationIds: string[]
  kind: TripKind
}

export interface LogItem {
  q: Question
  given: string
  ok: boolean
  ms: number
}

export interface TripStats {
  log: LogItem[]
  xp: number
  combo: number
  maxCombo: number
}

export interface TripSummary extends TripStats {
  config: TripConfig
  durationMs: number
  newStamps: string[]
  levelBefore: number
  levelAfter: number
}
