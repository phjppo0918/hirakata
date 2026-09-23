import { useState, type CSSProperties } from 'react'
import { LINES, STATIONS, cardKey, render, stationName, type Script } from '../lib/kana'
import { MAX_BOX, getCard, hasStamp, type Progress } from '../lib/progress'

export default function KanaChart({ progress }: { progress: Progress }) {
  const [script, setScript] = useState<Script>('hira')

  return (
    <div className={`chart line-${script}`}>
      <div className="chart__top">
        <h1 className="panel__title">글자표</h1>
        <div className="seg" role="group" aria-label="문자 선택">
          <button aria-pressed={script === 'hira'} onClick={() => setScript('hira')}>히라가나</button>
          <button aria-pressed={script === 'kata'} onClick={() => setScript('kata')}>가타카나</button>
        </div>
      </div>
      <p className="chart__legend">
        칸이 진할수록 잘 아는 글자예요. 정답을 맞힐 때마다 한 칸씩 진해지고, 틀리면 두 칸 옅어져요.
        <span className="legend">
          {Array.from({ length: MAX_BOX + 1 }, (_, b) => (
            <i key={b} style={{ '--b': b / MAX_BOX } as CSSProperties} />
          ))}
        </span>
      </p>

      {LINES.map((line) => (
        <section key={line.group} className="chart__line">
          <h2>{line.name}</h2>
          {STATIONS.filter((s) => s.group === line.group).map((st) => (
            <div key={st.id} className="chart__row">
              <div className="chart__station">
                <span lang="ja">{stationName(st, script)}</span>
                {hasStamp(progress, st, script) && <span className="minihanko" title="스탬프 획득">印</span>}
              </div>
              <div className="chart__cells">
                {st.entries.map((e) => {
                  const c = getCard(progress, cardKey(script, e.hira))
                  const acc = c.seen ? Math.round((c.correct / c.seen) * 100) : null
                  return (
                    <div
                      key={e.hira}
                      className={`cell${c.box >= 4 ? ' is-strong' : ''}`}
                      style={{ '--b': c.box / MAX_BOX } as CSSProperties}
                      title={acc === null ? '아직 안 풀어봤어요' : `${c.seen}번 중 ${c.correct}번 정답 (${acc}%)`}
                    >
                      <span className="cell__kana" lang="ja">{render(e.hira, script)}</span>
                      <span className="cell__roma">{e.romaji}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
