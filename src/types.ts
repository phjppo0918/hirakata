import type { Prompt, ScriptMode } from './lib/kana'

export type TripKind = 'trip' | 'express'
export type WordLength = 'single' | 'multi'

export interface TripConfig {
  mode: ScriptMode
  stationIds: string[]
  kind: TripKind
  length?: WordLength
}

export interface LogItem {
  q: Prompt
  given: string
  ok: boolean
  /** 글자별 정답 여부 (q.units와 같은 순서) */
  unitOk: boolean[]
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
