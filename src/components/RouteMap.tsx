import { useState, type CSSProperties } from 'react'
import { LINES, SCRIPT_META, STATIONS, render, stationName, type Script, type ScriptMode, type Station } from '../lib/kana'
import { hasStamp, stationMastery, weakStationIds, type Progress } from '../lib/progress'
import type { TripConfig, TripKind, WordLength } from '../types'

interface Props {
  progress: Progress
  onStart: (config: TripConfig) => void
}

const MODES: ScriptMode[] = ['hira', 'kata', 'mix']

export default function RouteMap({ progress, onStart }: Props) {
  const [mode, setMode] = useState<ScriptMode>('hira')
  const [kind, setKind] = useState<TripKind>('trip')
  const [length, setLength] = useState<WordLength>('single')
  const [selected, setSelected] = useState<string[]>(['a'])
  const weak = weakStationIds(progress)

  const scripts: Script[] = mode === 'mix' ? ['hira', 'kata'] : [mode]
  const shown: Script = mode === 'kata' ? 'kata' : 'hira'
  const charCount = STATIONS.filter((s) => selected.includes(s.id)).reduce((n, s) => n + s.entries.length, 0) * scripts.length

  const toggle = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  const selectGroup = (ids: string[]) =>
    setSelected((cur) => (ids.every((id) => cur.includes(id)) ? cur.filter((id) => !ids.includes(id)) : [...new Set([...cur, ...ids])]))

  return (
    <div className={`routemap line-${mode}`}>
      <section className="panel" aria-label="운행 설정">
        <h1 className="panel__title">어느 노선을 탈까요?</h1>
        <p className="panel__lead">역명판에 뜬 글자를 보고 로마자로 발음을 적으세요. 한 역의 글자를 모두 익히면 그 역의 스탬프를 받아요.</p>

        <fieldset className="field">
          <legend>노선</legend>
          <div className="lines">
            {MODES.map((m) => (
              <button key={m} className={`linechip line-${m}`} aria-pressed={mode === m} onClick={() => setMode(m)}>
                <span className="linechip__code">{SCRIPT_META[m].code}</span>
                <span className="linechip__name">{SCRIPT_META[m].name}</span>
                <span className="linechip__sample">{m === 'hira' ? 'あ' : m === 'kata' ? 'ア' : 'あア'}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend>운행 방식</legend>
          <div className="kinds">
            <button className="kind" aria-pressed={kind === 'trip'} onClick={() => setKind('trip')}>
              <strong>보통</strong>
              <span>{length === 'multi' ? '12문제' : '20문제'}, 시간 제한 없음</span>
            </button>
            <button className="kind" aria-pressed={kind === 'express'} onClick={() => setKind('express')}>
              <strong>급행</strong>
              <span>60초 동안 최대한 많이</span>
            </button>
          </div>
        </fieldset>

        <fieldset className="field">
          <legend>글자 수</legend>
          <div className="kinds">
            <button className="kind" aria-pressed={length === 'single'} onClick={() => setLength('single')}>
              <strong>한 글자</strong>
              <span lang="ja">か → ka</span>
            </button>
            <button className="kind" aria-pressed={length === 'multi'} onClick={() => setLength('multi')}>
              <strong>여러 글자</strong>
              <span>
                2~5글자 이어 읽기 · <span lang="ja">かさね</span> → kasane
              </span>
            </button>
          </div>
        </fieldset>

        <div className="quick">
          <button onClick={() => setSelected(STATIONS.filter((s) => s.group === 'basic').map((s) => s.id))}>본선 전체</button>
          <button onClick={() => setSelected(STATIONS.map((s) => s.id))}>모든 역</button>
          <button disabled={!weak.length} onClick={() => setSelected(weak)} title={weak.length ? '' : '아직 복습할 역이 없어요'}>
            약한 역만
          </button>
          <button disabled={!selected.length} onClick={() => setSelected([])}>선택 해제</button>
        </div>

        <div className="depart">
          <div className="depart__info">
            {selected.length ? (
              <>
                <strong>{selected.length}개 역</strong> · {charCount}글자
              </>
            ) : (
              '노선도에서 역을 하나 이상 고르세요'
            )}
          </div>
          <button className="depart__btn" disabled={!selected.length} onClick={() => onStart({ mode, kind, length, stationIds: selected })}>
            출발
          </button>
        </div>
      </section>

      <section className="map" aria-label="노선도">
        {LINES.map((line) => {
          const stations = STATIONS.filter((s) => s.group === line.group)
          const ids = stations.map((s) => s.id)
          return (
            <div key={line.group} className="map__line">
              <div className="map__head">
                <h2>{line.name}</h2>
                <span>{line.desc}</span>
                <button className="map__all" onClick={() => selectGroup(ids)}>
                  {ids.every((id) => selected.includes(id)) ? '이 노선 해제' : '이 노선 전체'}
                </button>
              </div>
              <ol className="track">
                {stations.map((st) => (
                  <StationStop
                    key={st.id}
                    st={st}
                    shown={shown}
                    scripts={scripts}
                    progress={progress}
                    selected={selected.includes(st.id)}
                    onToggle={() => toggle(st.id)}
                    mode={mode}
                  />
                ))}
              </ol>
            </div>
          )
        })}
      </section>
    </div>
  )
}

function StationStop(props: {
  st: Station
  shown: Script
  scripts: Script[]
  progress: Progress
  selected: boolean
  onToggle: () => void
  mode: ScriptMode
}) {
  const { st, shown, scripts, progress, selected, onToggle, mode } = props
  const mastery = scripts.reduce((a, s) => a + stationMastery(progress, st, s), 0) / scripts.length
  const stamped = scripts.every((s) => hasStamp(progress, st, s))
  const preview = st.entries.slice(0, 6).map((e) => render(e.hira, shown)).join(' ')

  return (
    <li className="stop">
      <button className="stop__btn" aria-pressed={selected} onClick={onToggle} style={{ '--m': mastery } as CSSProperties}>
        <span className={`stop__dot${stamped ? ' is-stamped' : ''}`} aria-hidden>
          {stamped ? render(st.head.slice(0, 1), shown) : ''}
        </span>
        <span className="stop__no">
          {SCRIPT_META[mode].code} {String(st.no).padStart(2, '0')}
        </span>
        <span className="stop__name">{stationName(st, shown)}</span>
        <span className="stop__chars">
          {preview}
          {st.entries.length > 6 ? ' …' : ''}
        </span>
        <span className="stop__meter" aria-label={`숙련도 ${Math.round(mastery * 100)}%`}>
          <span />
        </span>
        {stamped && <span className="visually-hidden">스탬프 획득</span>}
      </button>
    </li>
  )
}
