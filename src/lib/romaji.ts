// 두벌식 자판 → QWERTY. 한/영 전환을 깜빡하고 입력해도 알아듣기 위함.
const CHO = ['r', 'R', 's', 'e', 'E', 'f', 'a', 'q', 'Q', 't', 'T', 'd', 'w', 'W', 'c', 'z', 'x', 'v', 'g']
const JUNG = ['k', 'o', 'i', 'O', 'j', 'p', 'u', 'P', 'h', 'hk', 'ho', 'hl', 'y', 'n', 'nj', 'np', 'nl', 'b', 'm', 'ml', 'l']
const JONG = ['', 'r', 'R', 'rt', 's', 'sw', 'sg', 'e', 'f', 'fr', 'fa', 'fq', 'ft', 'fx', 'fv', 'fg', 'a', 'q', 'qt', 't', 'T', 'd', 'w', 'c', 'z', 'x', 'v', 'g']
// ㄱ(0x3131) ~ ㅣ(0x3163)
const COMPAT = [
  'r', 'R', 'rt', 's', 'sw', 'sg', 'e', 'E', 'f', 'fr', 'fa', 'fq', 'ft', 'fx', 'fv', 'fg', 'a', 'q', 'Q', 'qt', 't', 'T', 'd', 'w', 'W', 'c', 'z', 'x', 'v', 'g',
  'k', 'o', 'i', 'O', 'j', 'p', 'u', 'P', 'h', 'hk', 'ho', 'hl', 'y', 'n', 'nj', 'np', 'nl', 'b', 'm', 'ml', 'l',
]

export function hasHangul(s: string): boolean {
  return /[ㄱ-ㅣ가-힣]/.test(s)
}

export function hangulToQwerty(s: string): string {
  let out = ''
  for (const c of s) {
    const code = c.charCodeAt(0)
    if (code >= 0xac00 && code <= 0xd7a3) {
      const n = code - 0xac00
      out += CHO[Math.floor(n / 588)] + JUNG[Math.floor((n % 588) / 28)] + JONG[n % 28]
    } else if (code >= 0x3131 && code <= 0x3163) {
      out += COMPAT[code - 0x3131]
    } else {
      out += c
    }
  }
  return out
}

export function normalize(input: string): string {
  return hangulToQwerty(input).toLowerCase().replace(/[\s'’-]/g, '')
}

export function isCorrect(input: string, answers: string[]): boolean {
  return answers.includes(normalize(input))
}

/**
 * 여러 글자 답안에서 글자별로 맞았는지 판정한다.
 * 입력을 글자 단위로 나누는 방법 중 맞은 글자가 가장 많은 것을 고른다.
 */
export function gradeUnits(input: string, units: { answers: string[] }[]): boolean[] {
  const s = normalize(input)
  const memo = new Map<string, { score: number; marks: boolean[] }>()

  const best = (i: number, k: number): { score: number; marks: boolean[] } => {
    if (k === units.length) return { score: i === s.length ? 0 : -0.5, marks: [] }
    const id = `${i}:${k}`
    const hit = memo.get(id)
    if (hit) return hit
    let result = { score: -Infinity, marks: [] as boolean[] }
    for (const a of units[k].answers) {
      if (!s.startsWith(a, i)) continue
      const r = best(i + a.length, k + 1)
      if (r.score + 1 > result.score) result = { score: r.score + 1, marks: [true, ...r.marks] }
    }
    for (let skip = 0; skip <= 4 && i + skip <= s.length; skip++) {
      const r = best(i + skip, k + 1)
      if (r.score > result.score) result = { score: r.score, marks: [false, ...r.marks] }
    }
    memo.set(id, result)
    return result
  }

  return best(0, 0).marks
}
