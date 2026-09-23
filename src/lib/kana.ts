export type Script = 'hira' | 'kata'
export type ScriptMode = Script | 'mix'
export type LineGroup = 'basic' | 'dakuten' | 'yoon'

export interface KanaEntry {
  hira: string
  romaji: string
  alts: string[]
}

export interface Station {
  id: string
  no: number
  group: LineGroup
  head: string
  entries: KanaEntry[]
}

export interface Question {
  key: string
  script: Script
  char: string
  romaji: string
  answers: string[]
  stationId: string
}

const e = (hira: string, romaji: string, ...alts: string[]): KanaEntry => ({ hira, romaji, alts })

const RAW: Omit<Station, 'no'>[] = [
  { id: 'a', group: 'basic', head: 'あ', entries: [e('あ', 'a'), e('い', 'i'), e('う', 'u'), e('え', 'e'), e('お', 'o')] },
  { id: 'ka', group: 'basic', head: 'か', entries: [e('か', 'ka'), e('き', 'ki'), e('く', 'ku'), e('け', 'ke'), e('こ', 'ko')] },
  { id: 'sa', group: 'basic', head: 'さ', entries: [e('さ', 'sa'), e('し', 'shi', 'si'), e('す', 'su'), e('せ', 'se'), e('そ', 'so')] },
  { id: 'ta', group: 'basic', head: 'た', entries: [e('た', 'ta'), e('ち', 'chi', 'ti'), e('つ', 'tsu', 'tu'), e('て', 'te'), e('と', 'to')] },
  { id: 'na', group: 'basic', head: 'な', entries: [e('な', 'na'), e('に', 'ni'), e('ぬ', 'nu'), e('ね', 'ne'), e('の', 'no')] },
  { id: 'ha', group: 'basic', head: 'は', entries: [e('は', 'ha'), e('ひ', 'hi'), e('ふ', 'fu', 'hu'), e('へ', 'he'), e('ほ', 'ho')] },
  { id: 'ma', group: 'basic', head: 'ま', entries: [e('ま', 'ma'), e('み', 'mi'), e('む', 'mu'), e('め', 'me'), e('も', 'mo')] },
  { id: 'ya', group: 'basic', head: 'や', entries: [e('や', 'ya'), e('ゆ', 'yu'), e('よ', 'yo')] },
  { id: 'ra', group: 'basic', head: 'ら', entries: [e('ら', 'ra'), e('り', 'ri'), e('る', 'ru'), e('れ', 're'), e('ろ', 'ro')] },
  { id: 'wa', group: 'basic', head: 'わ', entries: [e('わ', 'wa'), e('を', 'wo', 'o'), e('ん', 'n', 'nn')] },
  { id: 'ga', group: 'dakuten', head: 'が', entries: [e('が', 'ga'), e('ぎ', 'gi'), e('ぐ', 'gu'), e('げ', 'ge'), e('ご', 'go')] },
  { id: 'za', group: 'dakuten', head: 'ざ', entries: [e('ざ', 'za'), e('じ', 'ji', 'zi'), e('ず', 'zu'), e('ぜ', 'ze'), e('ぞ', 'zo')] },
  { id: 'da', group: 'dakuten', head: 'だ', entries: [e('だ', 'da'), e('ぢ', 'ji', 'di', 'zi'), e('づ', 'zu', 'du'), e('で', 'de'), e('ど', 'do')] },
  { id: 'ba', group: 'dakuten', head: 'ば', entries: [e('ば', 'ba'), e('び', 'bi'), e('ぶ', 'bu'), e('べ', 'be'), e('ぼ', 'bo')] },
  { id: 'pa', group: 'dakuten', head: 'ぱ', entries: [e('ぱ', 'pa'), e('ぴ', 'pi'), e('ぷ', 'pu'), e('ぺ', 'pe'), e('ぽ', 'po')] },
  {
    id: 'kya', group: 'yoon', head: 'きゃ', entries: [
      e('きゃ', 'kya'), e('きゅ', 'kyu'), e('きょ', 'kyo'),
      e('しゃ', 'sha', 'sya'), e('しゅ', 'shu', 'syu'), e('しょ', 'sho', 'syo'),
      e('ちゃ', 'cha', 'tya', 'cya'), e('ちゅ', 'chu', 'tyu', 'cyu'), e('ちょ', 'cho', 'tyo', 'cyo'),
      e('にゃ', 'nya'), e('にゅ', 'nyu'), e('にょ', 'nyo'),
    ],
  },
  {
    id: 'hya', group: 'yoon', head: 'ひゃ', entries: [
      e('ひゃ', 'hya'), e('ひゅ', 'hyu'), e('ひょ', 'hyo'),
      e('みゃ', 'mya'), e('みゅ', 'myu'), e('みょ', 'myo'),
      e('りゃ', 'rya'), e('りゅ', 'ryu'), e('りょ', 'ryo'),
    ],
  },
  {
    id: 'gya', group: 'yoon', head: 'ぎゃ', entries: [
      e('ぎゃ', 'gya'), e('ぎゅ', 'gyu'), e('ぎょ', 'gyo'),
      e('じゃ', 'ja', 'zya', 'jya'), e('じゅ', 'ju', 'zyu', 'jyu'), e('じょ', 'jo', 'zyo', 'jyo'),
      e('びゃ', 'bya'), e('びゅ', 'byu'), e('びょ', 'byo'),
      e('ぴゃ', 'pya'), e('ぴゅ', 'pyu'), e('ぴょ', 'pyo'),
    ],
  },
]

export const STATIONS: Station[] = RAW.map((s, i) => ({ ...s, no: i + 1 }))

export const LINES: { group: LineGroup; name: string; desc: string }[] = [
  { group: 'basic', name: '본선', desc: '기본 46자' },
  { group: 'dakuten', name: '탁음 지선', desc: '゛와 ゜가 붙은 글자' },
  { group: 'yoon', name: '요음 급행', desc: 'ゃ·ゅ·ょ 조합' },
]

export const SCRIPT_META: Record<ScriptMode, { code: string; name: string; label: string }> = {
  hira: { code: 'HR', name: '히라가나선', label: '히라가나' },
  kata: { code: 'KT', name: '가타카나선', label: '가타카나' },
  mix: { code: 'MX', name: '환승 노선', label: '섞어서' },
}

export function toKata(s: string): string {
  return Array.from(s)
    .map((c) => {
      const code = c.charCodeAt(0)
      return code >= 0x3041 && code <= 0x3096 ? String.fromCharCode(code + 0x60) : c
    })
    .join('')
}

export function render(hira: string, script: Script): string {
  return script === 'kata' ? toKata(hira) : hira
}

export function stationName(st: Station, script: Script): string {
  return render(st.head, script) + '行'
}

export function cardKey(script: Script, hira: string): string {
  return `${script}:${hira}`
}

export function toQuestion(entry: KanaEntry, script: Script, stationId: string): Question {
  return {
    key: cardKey(script, entry.hira),
    script,
    char: render(entry.hira, script),
    romaji: entry.romaji,
    answers: [entry.romaji, ...entry.alts],
    stationId,
  }
}

export function buildPool(stationIds: string[], mode: ScriptMode): Question[] {
  const scripts: Script[] = mode === 'mix' ? ['hira', 'kata'] : [mode]
  const pool: Question[] = []
  for (const st of STATIONS) {
    if (!stationIds.includes(st.id)) continue
    for (const script of scripts) {
      for (const entry of st.entries) pool.push(toQuestion(entry, script, st.id))
    }
  }
  return pool
}

/** 한 문제. 한 글자 모드면 units가 1개, 여러 글자 모드면 2~5개 */
export interface Prompt {
  key: string
  script: Script
  char: string
  romaji: string
  answers: string[]
  units: Question[]
}

export function makePrompt(units: Question[]): Prompt {
  let answers = ['']
  for (const u of units) answers = answers.flatMap((pre) => u.answers.map((a) => pre + a))
  return {
    key: units.map((u) => u.key).join('+'),
    script: units[0].script,
    char: units.map((u) => u.char).join(''),
    romaji: units.map((u) => u.romaji).join(''),
    answers: [...new Set(answers)],
    units,
  }
}
