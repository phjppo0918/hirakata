import { levelFromXp, liveStreak, rankName, stampList, type Progress, type Settings } from '../lib/progress'

interface Props {
  progress: Progress
  settings: Settings
  onSettings: (s: Settings) => void
  active: 'map' | 'chart'
  onNav: (name: 'map' | 'chart') => void
  compact: boolean
}

export default function Header({ progress, settings, onSettings, active, onNav, compact }: Props) {
  const { level, into, span } = levelFromXp(progress.xp)
  const streak = liveStreak(progress)
  const stamps = stampList(progress).length

  return (
    <header className={`header${compact ? ' header--compact' : ''}`}>
      <div className="brand" aria-label="ひらかた線">
        <span className="brand__kana">ひらかた線</span>
        <span className="brand__roma">HIRAKATA LINE</span>
      </div>

      {!compact && (
        <nav className="nav" aria-label="화면">
          <button className="nav__btn" aria-current={active === 'map'} onClick={() => onNav('map')}>노선도</button>
          <button className="nav__btn" aria-current={active === 'chart'} onClick={() => onNav('chart')}>글자표</button>
        </nav>
      )}

      <div className="rider">
        <div className="rider__rank">
          <span className="rider__lv">Lv.{level}</span>
          <span>{rankName(level)}</span>
        </div>
        <div className="xpbar" role="progressbar" aria-label="다음 레벨까지" aria-valuemin={0} aria-valuemax={span} aria-valuenow={into}>
          <span style={{ width: `${(into / span) * 100}%` }} />
        </div>
        <div className="rider__meta">
          <span title="연속 학습일">{streak}일 연속</span>
          <span title="모은 역 스탬프">스탬프 {stamps}/36</span>
        </div>
      </div>

      <div className="toggles">
        <button className="toggle" aria-pressed={settings.sound} onClick={() => onSettings({ ...settings, sound: !settings.sound })}>
          효과음
        </button>
        <button className="toggle" aria-pressed={settings.voice} onClick={() => onSettings({ ...settings, voice: !settings.voice })}>
          발음 듣기
        </button>
      </div>
    </header>
  )
}
