let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  void ctx.resume();
  return ctx;
}

export function beep(freq: number, duration = 0.12, type: OscillatorType = "square", gain = 0.05) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  vol.gain.setValueAtTime(gain, ac.currentTime);
  vol.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  osc.connect(vol).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

export const sfx = {
  tick: () => beep(320, 0.05, "square", 0.03),
  spin: () => beep(180, 0.18, "sawtooth", 0.04),
  win: () => {
    beep(660, 0.12);
    setTimeout(() => beep(880, 0.16), 110);
    setTimeout(() => beep(1180, 0.22), 240);
  },
  lose: () => beep(140, 0.24, "triangle", 0.04),
  coin: () => {
    beep(1320, 0.07, "sine", 0.05);
    setTimeout(() => beep(1760, 0.09, "sine", 0.04), 70);
  },
  payout: () => {
    for (let i = 0; i < 6; i++) setTimeout(() => beep(880 + i * 120, 0.06, "square", 0.03), i * 70);
  },
  fanfare: () => {
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((n, i) => setTimeout(() => beep(n, 0.22, "triangle", 0.05), i * 110));
    setTimeout(() => {
      beep(1047, 0.5, "sawtooth", 0.04);
      beep(1568, 0.5, "sine", 0.04);
    }, 700);
  },
  flip: () => beep(520, 0.06, "sine", 0.05),
  match: () => beep(940, 0.14, "sine", 0.05),
};
