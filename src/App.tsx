import { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import RouteMap from './components/RouteMap'
import Play from './components/Play'
import Ticket from './components/Ticket'
import KanaChart from './components/KanaChart'
import {
  applyAnswer,
  finishTrip,
  levelFromXp,
  loadProgress,
  loadSettings,
  saveProgress,
  saveSettings,
  stampList,
  type Progress,
  type Settings,
} from './lib/progress'
import { sfx } from './lib/audio'
import type { TripConfig, TripStats, TripSummary } from './types'

type Screen = { name: 'map' } | { name: 'chart' } | { name: 'play'; config: TripConfig; id: number } | { name: 'ticket'; summary: TripSummary }

export default function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [screen, setScreen] = useState<Screen>({ name: 'map' })
  const progressRef = useRef(progress)
  progressRef.current = progress
  const tripStart = useRef({ stamps: [] as string[], level: 1, at: 0 })

  useEffect(() => saveProgress(progress), [progress])
  useEffect(() => saveSettings(settings), [settings])

  const start = (config: TripConfig) => {
    tripStart.current = { stamps: stampList(progress), level: levelFromXp(progress.xp).level, at: Date.now() }
    setScreen({ name: 'play', config, id: Date.now() })
  }

  const finish = (config: TripConfig, stats: TripStats) => {
    const next = finishTrip(progressRef.current, stats.maxCombo)
    setProgress(next)
    const before = tripStart.current
    const newStamps = stampList(next).filter((s) => !before.stamps.includes(s))
    if (newStamps.length && settings.sound) setTimeout(() => sfx.stamp(), 500)
    setScreen({
      name: 'ticket',
      summary: {
        ...stats,
        config,
        durationMs: Date.now() - before.at,
        newStamps,
        levelBefore: before.level,
        levelAfter: levelFromXp(next.xp).level,
      },
    })
  }

  const playing = screen.name === 'play'

  return (
    <div className="app">
      <Header
        progress={progress}
        settings={settings}
        onSettings={setSettings}
        active={screen.name === 'chart' ? 'chart' : 'map'}
        onNav={(name) => setScreen(name === 'chart' ? { name: 'chart' } : { name: 'map' })}
        compact={playing}
      />
      <main className="main">
        {screen.name === 'map' && <RouteMap progress={progress} onStart={start} />}
        {screen.name === 'chart' && <KanaChart progress={progress} />}
        {screen.name === 'play' && (
          <Play
            key={screen.id}
            config={screen.config}
            progress={progress}
            settings={settings}
            onAnswer={(key, ok, xp) => setProgress((p) => applyAnswer(p, key, ok, xp))}
            onFinish={(stats) => finish(screen.config, stats)}
            onQuit={() => setScreen({ name: 'map' })}
          />
        )}
        {screen.name === 'ticket' && (
          <Ticket
            summary={screen.summary}
            onAgain={() => start(screen.summary.config)}
            onMap={() => setScreen({ name: 'map' })}
          />
        )}
      </main>
    </div>
  )
}
