import { STATIONS, cardKey, makePrompt, type Prompt, type Question, type Script, type Station } from './kana'

export const MAX_BOX = 5
export const STAMP_BOX = 3

export interface Card {
  box: number
  seen: number
  correct: number
}

export interface Progress {
  xp: number
  cards: Record<string, Card>
  bestCombo: number
  streak: { count: number; last: string | null }
  trips: number
}

export interface Settings {
  sound: boolean
  voice: boolean
}

const PROGRESS_KEY = 'hirakata.progress.v1'
const SETTINGS_KEY = 'hirakata.settings.v1'

export const emptyProgress = (): Progress => ({
  xp: 0,
  cards: {},
  bestCombo: 0,
  streak: { count: 0, last: null },
  trips: 0,
})

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 공간이 막혀 있어도 게임은 계속 진행
  }
}

export const loadProgress = () => read(PROGRESS_KEY, emptyProgress())
export const saveProgress = (p: Progress) => write(PROGRESS_KEY, p)
export const loadSettings = () => read<Settings>(SETTINGS_KEY, { sound: true, voice: false })
export const saveSettings = (s: Settings) => write(SETTINGS_KEY, s)

export function getCard(p: Progress, key: string): Card {
  return p.cards[key] ?? { box: 0, seen: 0, correct: 0 }
}

export function applyAnswer(p: Progress, key: string, ok: boolean, xp: number): Progress {
  const c = getCard(p, key)
  const next: Card = {
    box: ok ? Math.min(MAX_BOX, c.box + 1) : Math.max(0, c.box - 2),
    seen: c.seen + 1,
    correct: c.correct + (ok ? 1 : 0),
  }
  return { ...p, xp: p.xp + xp, cards: { ...p.cards, [key]: next } }
}

export function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function finishTrip(p: Progress, bestCombo: number, today = localDate()): Progress {
  const { count, last } = p.streak
  let nextCount = 1
  if (last === today) nextCount = count
  else if (last) {
    const diff = Math.round((Date.parse(today) - Date.parse(last)) / 86_400_000)
    nextCount = diff === 1 ? count + 1 : 1
  }
  return {
    ...p,
    bestCombo: Math.max(p.bestCombo, bestCombo),
    streak: { count: nextCount, last: today },
    trips: p.trips + 1,
  }
}

/** 연속 기록이 오늘 또는 어제까지 이어져 있을 때만 유효 */
export function liveStreak(p: Progress, today = localDate()): number {
  if (!p.streak.last) return 0
  const diff = Math.round((Date.parse(today) - Date.parse(p.streak.last)) / 86_400_000)
  return diff <= 1 ? p.streak.count : 0
}

export function stationMastery(p: Progress, st: Station, script: Script): number {
  const total = st.entries.length * MAX_BOX
  const sum = st.entries.reduce((acc, e) => acc + getCard(p, cardKey(script, e.hira)).box, 0)
  return sum / total
}

export function hasStamp(p: Progress, st: Station, script: Script): boolean {
  return st.entries.every((e) => getCard(p, cardKey(script, e.hira)).box >= STAMP_BOX)
}

export function stampList(p: Progress): string[] {
  const out: string[] = []
  for (const st of STATIONS) {
    for (const script of ['hira', 'kata'] as Script[]) {
      if (hasStamp(p, st, script)) out.push(`${script}:${st.id}`)
    }
  }
  return out
}

export function levelFromXp(xp: number) {
  // n레벨 도달에 필요한 누적 XP = 50·n·(n-1)
  let level = 1
  while (50 * (level + 1) * level <= xp) level++
  const floor = 50 * level * (level - 1)
  const ceil = 50 * (level + 1) * level
  return { level, into: xp - floor, span: ceil - floor }
}

export function rankName(level: number): string {
  if (level >= 15) return '신칸센 기관사'
  if (level >= 11) return '급행 기관사'
  if (level >= 8) return '기관사'
  if (level >= 5) return '차장'
  if (level >= 3) return '역무원'
  return '견습생'
}

/** 약한 글자일수록 자주 나오도록 가중치를 두고 뽑는다 */
export function pickNext(pool: Question[], p: Progress, recent: string[], rand = Math.random): Question {
  const candidates = pool.length > 4 ? pool.filter((q) => !recent.includes(q.key)) : pool.filter((q) => q.key !== recent[recent.length - 1])
  const list = candidates.length ? candidates : pool
  const weights = list.map((q) => {
    const c = getCard(p, q.key)
    return (MAX_BOX + 1 - c.box) ** 2 + (c.seen === 0 ? 6 : 0)
  })
  let r = rand() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < list.length; i++) {
    r -= weights[i]
    if (r <= 0) return list[i]
  }
  return list[list.length - 1]
}

/** 여러 글자 문제는 한 문자(히라가나 또는 가타카나)로만 구성하고, ん·を로 시작하지 않게 한다 */
export function pickPrompt(pool: Question[], p: Progress, recent: string[], length: number, rand = Math.random): Prompt {
  let list = pool
  if (length > 1) {
    const scripts = [...new Set(pool.map((q) => q.script))]
    const script = scripts[Math.floor(rand() * scripts.length)]
    list = pool.filter((q) => q.script === script)
  }
  const units: Question[] = []
  let seen = [...recent]
  for (let i = 0; i < length; i++) {
    const starters = i === 0 && length > 1 ? list.filter((q) => !BAD_START.includes(q.key.split(':')[1])) : list
    const q = pickNext(starters.length ? starters : list, p, seen, rand)
    units.push(q)
    seen = [...seen, q.key].slice(-3)
  }
  return makePrompt(units)
}

const BAD_START = ['ん', 'を']

export function weakStationIds(p: Progress): string[] {
  const ids = STATIONS.filter((st) =>
    (['hira', 'kata'] as Script[]).some((s) => {
      const m = stationMastery(p, st, s)
      return m > 0 && m < STAMP_BOX / MAX_BOX
    }),
  ).map((s) => s.id)
  return ids
}
