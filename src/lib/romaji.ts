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
