import { SCRIPT_META, STATIONS, stationName, type Script } from '../lib/kana'
import { rankName } from '../lib/progress'
import type { LogItem, TripSummary } from '../types'

interface Props {
  summary: TripSummary
  onAgain: () => void
  onMap: () => void
}

export default function Ticket({ summary, onAgain, onMap }: Props) {
  const { log, xp, maxCombo, config, durationMs, newStamps, levelBefore, levelAfter } = summary
  const right = log.filter((l) => l.ok).length
  const acc = log.length ? Math.round((right / log.length) * 100) : 0
  const stations = STATIONS.filter((s) => config.stationIds.includes(s.id))
  const shown: Script = config.mode === 'kata' ? 'kata' : 'hira'
  const from = stations[0]
  const to = stations[stations.length - 1]
  const misses = dedupeMisses(log)
  const secs = Math.round(durationMs / 1000)

  return (
    <div className="result">
      <article className={`ticket line-${config.mode}`} aria-label="운행 기록">
        <header className="ticket__head">
          <span>{SCRIPT_META[config.mode].name} · {config.kind === 'express' ? '급행' : '보통'}</span>
          <span className="ticket__kind" lang="ja">乗車券</span>
        </header>

        <div className="ticket__route">
          <span lang="ja">{stationName(from, shown)}</span>
          <span className="ticket__arrow" aria-label="에서">→</span>
          <span lang="ja">{from === to ? '折返し' : stationName(to, shown)}</span>
        </div>

        <dl className="ticket__stats">
          <div>
            <dt>정답</dt>
            <dd>
              {right}<small>/{log.length}</small>
            </dd>
          </div>
          <div>
            <dt>정답률</dt>
            <dd>{acc}<small>%</small></dd>
          </div>
          <div>
            <dt>최고 콤보</dt>
            <dd>{maxCombo}</dd>
          </div>
          <div>
            <dt>획득 XP</dt>
            <dd>+{xp}</dd>
          </div>
        </dl>

        <footer className="ticket__foot">
          <span>{Math.floor(secs / 60)}분 {secs % 60}초 운행</span>
          <span>{log.length ? `평균 ${(log.reduce((a, l) => a + l.ms, 0) / log.length / 1000).toFixed(1)}초/글자` : ''}</span>
        </footer>

        {newStamps.length > 0 && (
          <div className="stamps" aria-label="새로 받은 스탬프">
            {newStamps.map((k, i) => {
              const [script, id] = k.split(':') as [Script, string]
              const st = STATIONS.find((s) => s.id === id)!
              return (
                <span key={k} className="stamp" style={{ animationDelay: `${0.4 + i * 0.25}s` }} lang="ja">
                  <b>{stationName(st, script)}</b>
                  <small>ひらかた線</small>
                </span>
              )
            })}
          </div>
        )}
      </article>

      <div className="result__side">
        {levelAfter > levelBefore && (
          <p className="promo">
            승급했어요! <b>Lv.{levelAfter} {rankName(levelAfter)}</b>
          </p>
        )}
        {newStamps.length > 0 && <p className="promo promo--stamp">역 스탬프 {newStamps.length}개를 새로 받았어요.</p>}

        <h2 className="result__h">{misses.length ? '다시 볼 글자' : '틀린 글자가 없어요'}</h2>
        {misses.length > 0 ? (
          <ul className="misses">
            {misses.map((m) => (
              <li key={m.q.key}>
                <span className="misses__kana" lang="ja">{m.q.char}</span>
                <span className="misses__roma">{m.q.romaji}</span>
                <span className="misses__given">{m.given ? `입력: ${m.given}` : '건너뜀'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="result__note">{log.length ? '이 구간은 완벽해요. 다음 역으로 넘어가 보세요.' : '한 글자도 풀지 않고 하차했어요.'}</p>
        )}

        <div className="result__actions">
          <button className="btn btn--primary" onClick={onAgain} autoFocus>
            같은 구간 다시 타기
          </button>
          <button className="btn" onClick={onMap}>
            노선도로
          </button>
        </div>
      </div>
    </div>
  )
}

function dedupeMisses(log: LogItem[]): LogItem[] {
  const seen = new Map<string, LogItem>()
  for (const l of log) if (!l.ok && !seen.has(l.q.key)) seen.set(l.q.key, l)
  return [...seen.values()]
}
