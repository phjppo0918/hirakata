let ctx: AudioContext | null = null

function tone(freq: number, start: number, dur: number, gain = 0.12) {
  if (!ctx) ctx = new AudioContext()
  const t = ctx.currentTime + start
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

export const sfx = {
  // 역 안내 차임처럼 두 음
  right(combo: number) {
    const lift = Math.min(combo, 10) * 18
    tone(784 + lift, 0, 0.18)
    tone(1175 + lift, 0.09, 0.28)
  },
  wrong() {
    tone(220, 0, 0.22, 0.1)
    tone(196, 0.12, 0.3, 0.1)
  },
  stamp() {
    tone(523, 0, 0.2)
    tone(659, 0.12, 0.2)
    tone(784, 0.24, 0.2)
    tone(1047, 0.36, 0.5)
  },
}

export function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = 0.85
  const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith('ja'))
  if (voice) u.voice = voice
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}
