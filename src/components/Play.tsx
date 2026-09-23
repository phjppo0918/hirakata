import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { SCRIPT_META, STATIONS, buildPool, stationName, type Question } from '../lib/kana'
import { hangulToQwerty, hasHangul, isCorrect, normalize } from '../lib/romaji'
import { pickNext, type Progress, type Settings } from '../lib/progress'
import { sfx, speak } from '../lib/audio'
import type { LogItem, TripConfig, TripStats } from '../types'

export const TRIP_LEN = 20
export const EXPRESS_MS = 60_000
const FAST_MS = 2500

interface Props {
  config: TripConfig
  progress: Progress
  settings: Settings
  onAnswer: (key: string, ok: boolean, xp: number) => void
  onFinish: (stats: TripStats) => void
  onQuit: () => void
}

type Phase = 'ask' | 'right' | 'wrong'

export const multiplier = (combo: number) => Math.min(4, 1 + Math.floor(combo / 5))

export default function Play({ config, progress, settings, onAnswer, onFinish, onQuit }: Props) {
  const pool = useMemo(() => buildPool(config.stationIds, config.mode), [config])
  const progressRef = useRef(progress)
  progressRef.current = progress
  const recent = useRef<string[]>([])
  const draw = (): Question => {
    const q = pickNext(pool, progressRef.current, recent.current)
    recent.current = [...recent.current, q.key].slice(-3)
    return q
  }

  const stats = useRef<TripStats>({ log: [], xp: 0, combo: 0, maxCombo: 0 })
  const [, rerender] = useReducer((x: number) => x + 1, 0)
  const [q, setQ] = useState<Question>(draw)
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<Phase>('ask')
  const [prev, setPrev] = useState<LogItem | null>(null)
  const [gain, setGain] = useState<{ v: number; id: number } | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const startedAt = useRef(Date.now())
  const askedAt = useRef(performance.now())
  const timer = useRef<number>(0)
  const done = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const express = config.kind === 'express'
  const remaining = Math.max(0, EXPRESS_MS - (now - startedAt.current))

  const finish = () => {
    if (done.current) return
    done.current = true
    window.clearTimeout(timer.current)
    onFinish(stats.current)
  }

  const advance = () => {
    window.clearTimeout(timer.current)
    const s = stats.current
    if (!express && s.log.length >= TRIP_LEN) return finish()
    if (express && Date.now() - startedAt.current >= EXPRESS_MS) return finish()
    setPrev(s.log[s.log.length - 1] ?? null)
    setQ(draw())
    setInput('')
    setPhase('ask')
    setGain(null)
    askedAt.current = performance.now()
    inputRef.current?.focus()
  }

  const submit = (ok: boolean, given: string) => {
    if (phase !== 'ask' || done.current) return
    const ms = performance.now() - askedAt.current
    const s = stats.current
    let gained = 0
    if (ok) {
      s.combo += 1
      s.maxCombo = Math.max(s.maxCombo, s.combo)
      gained = 10 * multiplier(s.combo) + (ms < FAST_MS ? 5 : 0)
      s.xp += gained
    } else {
      s.combo = 0
    }
    s.log.push({ q, given, ok, ms })
    onAnswer(q.key, ok, gained)
    if (settings.sound) (ok ? sfx.right(s.combo) : sfx.wrong())
    if (settings.voice) speak(q.char)
    setPhase(ok ? 'right' : 'wrong')
    setGain(ok ? { v: gained, id: s.log.length } : null)
    rerender()
    if (ok) timer.current = window.setTimeout(advance, 420)
    else if (express) timer.current = window.setTimeout(advance, 1100)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    if (!express) return
    const id = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [express])

  useEffect(() => {
    // 급행은 시간이 다 되면 현재 문제를 마치고 하차
    if (express && remaining <= 0 && phase === 'ask') finish()
  })

  const onChange = (v: string) => {
    setInput(v)
    if (phase === 'ask' && isCorrect(v, q.answers)) submit(true, v)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
    e.preventDefault()
    if (phase === 'ask') submit(isCorrect(input, q.answers), input)
    else if (phase === 'wrong') advance()
  }

  const s = stats.current
  const station = STATIONS.find((st) => st.id === q.stationId)!
  const lineClass = `line-${q.script}`
  const mult = multiplier(s.combo)
  const qNo = s.log.length + (phase === 'ask' ? 1 : 0)
  const converted = hasHangul(input) ? normalize(input) : ''

  return (
    <div className={`play ${lineClass}`}>
      <div className="hud">
        <div className="hud__combo" data-hot={s.combo >= 5}>
          <span className="hud__label">콤보</span>
          <span className="hud__value">{s.combo}</span>
          {mult > 1 && <span className="hud__mult">×{mult}</span>}
        </div>
        <div className="hud__xp">
          <span className="hud__label">획득 XP</span>
          <span className="hud__value">{s.xp}</span>
          {gain && (
            <span key={gain.id} className="hud__gain">
              +{gain.v}
            </span>
          )}
        </div>
        {express ? (
          <div className="hud__clock" data-low={remaining < 10_000}>
            <span className="hud__label">남은 시간</span>
            <span className="hud__value">{(remaining / 1000).toFixed(1)}</span>
          </div>
        ) : (
          <div className="hud__train" aria-label={`${TRIP_LEN}문제 중 ${s.log.length}문제 완료`}>
            {Array.from({ length: TRIP_LEN }, (_, i) => {
              const item = s.log[i]
              return <span key={i} className={item ? (item.ok ? 'is-ok' : 'is-miss') : i === s.log.length ? 'is-now' : ''} />
            })}
          </div>
        )}
      </div>

      <div className={`sign is-${phase}`}>
        <div className="sign__top">
          <span className="sign__badge" aria-label={`${qNo}번째 문제`}>
            <small>{SCRIPT_META[config.mode].code}</small>
            <b>{String(Math.max(1, qNo)).padStart(2, '0')}</b>
          </span>
          <span className="sign__station">{stationName(station, q.script)}</span>
        </div>

        <div className="sign__kana" lang="ja" key={q.key + s.log.length}>
          {q.char}
        </div>

        <div className="sign__slot">
          <label htmlFor="answer" className="visually-hidden">
            {q.char}의 로마자 발음
          </label>
          <input
            id="answer"
            ref={inputRef}
            className="sign__input"
            value={input}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            readOnly={phase !== 'ask'}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="romaji"
            aria-describedby="answer-hint"
          />
          <div id="answer-hint" className="sign__hint" aria-live="polite">
            {phase === 'wrong' ? (
              <span className="sign__answer">
                정답 <b>{q.romaji}</b>
                {q.answers.length > 1 && <em> ({q.answers.slice(1).join(', ')}도 정답)</em>}
              </span>
            ) : converted ? (
              <span>한글 자판으로 입력 중 → {hangulToQwerty(input).toLowerCase()}</span>
            ) : (
              <span>&nbsp;</span>
            )}
          </div>
        </div>

        <div className="sign__band" />
        <div className="sign__neighbors">
          <span className={`sign__prev${prev ? (prev.ok ? ' is-ok' : ' is-miss') : ''}`}>
            {prev ? (
              <>
                <span aria-hidden>◀</span> <span lang="ja">{prev.q.char}</span> <span className="roma">{prev.q.romaji}</span>
              </>
            ) : (
              <span className="roma">始発</span>
            )}
          </span>
          <span className="sign__next">
            <span className="roma">?</span> <span aria-hidden>▶</span>
          </span>
        </div>
      </div>

      <div className="controls">
        {phase === 'wrong' && !express ? (
          <button className="btn btn--primary" onClick={advance} autoFocus>
            다음 역으로 <kbd>Enter</kbd>
          </button>
        ) : (
          <button className="btn" onClick={() => submit(false, '')} disabled={phase !== 'ask'}>
            모르겠어요 <kbd>Enter</kbd>
          </button>
        )}
        <button className="btn btn--ghost" onClick={s.log.length ? finish : onQuit}>
          {s.log.length ? '여기서 하차' : '돌아가기'}
        </button>
      </div>
      <p className="play__tip">정답을 입력하면 바로 다음 글자로 넘어가요. 빈칸에서 Enter를 누르면 정답을 보여줘요.</p>
    </div>
  )
}
