import { describe, expect, it } from 'vitest'
import { gradeUnits, hangulToQwerty, isCorrect } from './romaji'
import { STATIONS, buildPool, makePrompt, toKata } from './kana'
import { applyAnswer, emptyProgress, pickPrompt, finishTrip, hasStamp, levelFromXp, liveStreak } from './progress'

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

describe('multi-kana prompts', () => {
  const pool = buildPool(['sa', 'wa', 'a'], 'hira')
  const q = (h: string) => pool.find((x) => x.key === `hira:${h}`)!

  it('accepts any mix of alternate romanizations', () => {
    const p = makePrompt([q('し'), q('ん'), q('あ')])
    expect(p.char).toBe('しんあ')
    for (const a of ['shina', 'sinna', 'shin\'a', 'SHI NN A']) expect(isCorrect(a, p.answers)).toBe(true)
    expect(isCorrect('shi', p.answers)).toBe(false)
  })

  it('pinpoints which kana were wrong', () => {
    const p = makePrompt([q('さ'), q('し'), q('す')])
    expect(gradeUnits('sashisu', p.units)).toEqual([true, true, true])
    expect(gradeUnits('sasisu', p.units)).toEqual([true, true, true])
    expect(gradeUnits('sachisu', p.units)).toEqual([true, false, true])
    expect(gradeUnits('seshisa', p.units)).toEqual([false, true, false])
    expect(gradeUnits('', p.units)).toEqual([false, false, false])
  })

  it('keeps one script per prompt and never starts with ん', () => {
    const mix = buildPool(['a', 'wa'], 'mix')
    for (let i = 0; i < 200; i++) {
      const p = pickPrompt(mix, emptyProgress(), [], 5)
      expect(p.units).toHaveLength(5)
      expect(new Set(p.units.map((u) => u.script)).size).toBe(1)
      expect(['ん', 'ン', 'を', 'ヲ']).not.toContain(p.units[0].char)
    }
  })
})
