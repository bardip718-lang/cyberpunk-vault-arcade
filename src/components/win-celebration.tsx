import { useEffect, useMemo, useRef, useState } from "react";

export type WinTier = "nice" | "big" | "jackpot";

export function tierFor(multiplier: number): WinTier {
  if (multiplier >= 20) return "jackpot";
  if (multiplier >= 7) return "big";
  return "nice";
}

const TIER_COPY: Record<WinTier, { label: string; sub: string }> = {
  nice: { label: "NICE WIN!", sub: "Payline locked" },
  big: { label: "BIG WIN!", sub: "The grid is hot" },
  jackpot: { label: "JACKPOT!", sub: "Vault overload" },
};

const NEON = ["#ff2fd0", "#00f0ff", "#ffd23f", "#8b5cf6", "#39ff88"];

/** Odometer-style counting number. */
export function CountUp({ value, duration = 900, className }: { value: number; duration?: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value, duration]);

  return <span className={className}>{display.toLocaleString()}</span>;
}

function Coins({ count }: { count: number }) {
  const coins = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        dur: 1.7 + Math.random() * 1.4,
        size: 14 + Math.random() * 18,
      })),
    [count],
  );
  return (
    <>
      {coins.map((c) => (
        <span
          key={c.id}
          aria-hidden
          className="animate-coin-fall absolute top-0 rounded-full"
          style={{
            left: `${c.left}%`,
            width: c.size,
            height: c.size,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.dur}s`,
            background: "radial-gradient(circle at 32% 30%, #fff3b0, #ffd23f 45%, #b8860b 100%)",
            boxShadow: "0 0 14px rgba(255,210,63,0.85)",
          }}
        />
      ))}
    </>
  );
}

function Sparkles({ count }: { count: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 1.4,
        color: NEON[i % NEON.length]!,
        size: 4 + Math.random() * 6,
      })),
    [count],
  );
  return (
    <>
      {items.map((s) => (
        <span
          key={s.id}
          aria-hidden
          className="absolute animate-ping rounded-full"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 12px ${s.color}`,
            animationDelay: `${s.delay}s`,
            animationDuration: "1.3s",
          }}
        />
      ))}
    </>
  );
}

export function WinCelebration({
  active,
  tier,
  amount,
  onDone,
  duration = 3200,
}: {
  active: boolean;
  tier: WinTier;
  amount: number;
  onDone?: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    void (async () => {
      try {
        const confetti = (await import("canvas-confetti")).default;
        if (cancelled) return;
        const bursts = tier === "jackpot" ? 5 : tier === "big" ? 3 : 1;
        const shoot = (i: number) =>
          confetti({
            particleCount: tier === "jackpot" ? 120 : 70,
            spread: 80 + i * 12,
            startVelocity: 45,
            ticks: 180,
            origin: { x: 0.5, y: 0.55 },
            colors: NEON,
            scalar: 1.05,
            disableForReducedMotion: true,
          });
        shoot(0);
        for (let i = 1; i < bursts; i++) {
          await new Promise((r) => setTimeout(r, 320));
          if (cancelled) return;
          shoot(i);
        }
      } catch {
        /* confetti is decorative */
      }
    })();

    const t = setTimeout(() => onDone?.(), duration);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [active, tier, duration, onDone]);

  if (!active) return null;
  const copy = TIER_COPY[tier];

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" role="status" aria-live="polite">
      <div className="absolute inset-0 bg-background/35 backdrop-blur-[1px]" />
      <Coins count={tier === "jackpot" ? 34 : tier === "big" ? 22 : 12} />
      <Sparkles count={tier === "jackpot" ? 26 : 16} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-win-banner animate-win-border rounded-2xl border border-primary/50 bg-card/85 px-8 py-6 text-center sm:px-14 sm:py-8">
          <p className="font-display neon-text text-4xl tracking-[0.18em] sm:text-6xl">{copy.label}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.35em] text-muted-foreground">{copy.sub}</p>
          <p className="font-display mt-3 text-3xl text-success sm:text-5xl">
            +<CountUp value={amount} duration={tier === "jackpot" ? 1400 : 900} />
          </p>
        </div>
      </div>
    </div>
  );
}
