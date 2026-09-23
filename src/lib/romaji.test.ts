import { describe, expect, it } from 'vitest'
import { hangulToQwerty, isCorrect } from './romaji'
import { STATIONS, buildPool, toKata } from './kana'
import { applyAnswer, emptyProgress, finishTrip, hasStamp, levelFromXp, liveStreak } from './progress'

describe('romaji', () => {
  it('accepts alternate romanizations', () => {
    expect(isCorrect('shi', ['shi', 'si'])).toBe(true)
    expect(isCorrect(' SI ', ['shi', 'si'])).toBe(true)
    expect(isCorrect('sh', ['shi', 'si'])).toBe(false)
  })

  it('reads input typed with a Korean keyboard layout', () => {
    expect(hangulToQwerty('노ㅑ')).toBe('shi')
    expect(hangulToQwerty('ㅅ녀')).toBe('tsu')
    expect(isCorrect('ㅏㅁ', ['ka'])).toBe(true)
    expect(isCorrect('ㅏㅁ', ['ki'])).toBe(false)
    expect(isCorrect('ㅏㅛㅐ', ['kyo'])).toBe(true)
  })
})

describe('kana', () => {
  it('converts hiragana to katakana', () => {
    expect(toKata('きゃ')).toBe('キャ')
    expect(toKata('を')).toBe('ヲ')
    expect(toKata('ん')).toBe('ン')
  })

  it('builds a mixed pool with both scripts', () => {
    expect(buildPool(['a'], 'mix')).toHaveLength(10)
    expect(buildPool(['a', 'wa'], 'kata').map((q) => q.char)).toEqual(['ア', 'イ', 'ウ', 'エ', 'オ', 'ワ', 'ヲ', 'ン'])
  })
})

describe('progress', () => {
  it('grants a stamp once every kana in a station reaches box 3', () => {
    let p = emptyProgress()
    const st = STATIONS[0]
    for (let i = 0; i < 3; i++) for (const e of st.entries) p = applyAnswer(p, `hira:${e.hira}`, true, 10)
    expect(hasStamp(p, st, 'hira')).toBe(true)
    expect(hasStamp(p, st, 'kata')).toBe(false)
    p = applyAnswer(p, 'hira:あ', false, 0)
    expect(hasStamp(p, st, 'hira')).toBe(false)
  })

  it('counts consecutive days', () => {
    let p = finishTrip(emptyProgress(), 3, '2026-09-20')
    p = finishTrip(p, 3, '2026-09-21')
    p = finishTrip(p, 3, '2026-09-21')
    expect(p.streak.count).toBe(2)
    expect(liveStreak(p, '2026-09-22')).toBe(2)
    expect(liveStreak(p, '2026-09-24')).toBe(0)
    expect(finishTrip(p, 1, '2026-09-25').streak.count).toBe(1)
  })

  it('computes levels', () => {
    expect(levelFromXp(0).level).toBe(1)
    expect(levelFromXp(99).level).toBe(1)
    expect(levelFromXp(100).level).toBe(2)
    expect(levelFromXp(300).level).toBe(3)
  })
})
