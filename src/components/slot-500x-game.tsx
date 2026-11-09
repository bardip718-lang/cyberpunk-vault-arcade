import { useEffect, useRef, useState } from "react";
import { Gem, Minus, Plus, RotateCcw, Volume2, VolumeX, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { evaluateSlot, pickSlotSymbol, type SlotSymbol } from "@/lib/slot-engine";
import { Slot500xEngine, type Slot500xResult } from "@/lib/slot500x-engine";

const INITIAL_GRID: SlotSymbol[][] = [
  ["ruby", "wild", "A"],
  ["emerald", "ruby", "K"],
  ["sapphire", "emerald", "wild"],
  ["wild", "sapphire", "Q"],
  ["ruby", "K", "emerald"],
];

interface PendingSpin {
  grid: SlotSymbol[][];
  result: Slot500xResult;
}

export function Slot500xGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Slot500xEngine | null>(null);
  const pendingRef = useRef<PendingSpin | null>(null);
  const busyRef = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);
  const soundRef = useRef(true);

  const [balance, setBalance] = useState(2000);
  const [bet, setBet] = useState(30);
  const [win, setWin] = useState(0);
  const [displayWin, setDisplayWin] = useState(0);
  const [grid, setGrid] = useState(INITIAL_GRID);
  const [spinning, setSpinning] = useState(false);
  const [sound, setSound] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(query.matches);
      engineRef.current?.setReducedMotion(query.matches);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!win) {
      setDisplayWin(0);
      return;
    }
    if (reducedMotion) {
      setDisplayWin(win);
      return;
    }
    let frame = 0;
    const started = performance.now();
    const update = (now: number) => {
      const progress = Math.min(1, (now - started) / 700);
      setDisplayWin(Math.round(win * progress));
      if (progress < 1) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [win, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let mounted = true;

    const tone = (frequency: number, duration = 0.12, volume = 0.035) => {
      const context = audioRef.current;
      if (!context || !soundRef.current) return;
      try {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start();
        oscillator.stop(context.currentTime + duration);
      } catch {
        // Sound is optional; a blocked or closing AudioContext never stops play.
      }
    };

    try {
      const engine = new Slot500xEngine(canvas, INITIAL_GRID, {
        onReelStop: (column) => tone(180 + column * 45, 0.09),
        onComplete: () => {
          if (!mounted) return;
          const pending = pendingRef.current;
          pendingRef.current = null;
          busyRef.current = false;
          setSpinning(false);
          if (!pending) return;
          setGrid(pending.grid);
          setWin(pending.result.total);
          setBalance((current) => current + pending.result.total);
          if (pending.result.total > 0) {
            tone(784, 0.2, 0.045);
            window.setTimeout(() => tone(1046, 0.24, 0.035), 100);
          }
        },
      });
      engineRef.current = engine;
      engine.setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      void engine.loadAssets().then(() => {
        if (mounted) setReady(true);
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The 500X canvas could not be started.");
    }

    return () => {
      mounted = false;
      pendingRef.current = null;
      busyRef.current = false;
      engineRef.current?.destroy();
      engineRef.current = null;
      void audioRef.current?.close();
      audioRef.current = null;
    };
  }, []);

  function unlockAudio() {
    if (!soundRef.current) return;
    try {
      if (!audioRef.current) {
        const AudioContextConstructor = window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextConstructor) return;
        audioRef.current = new AudioContextConstructor();
      }
      void audioRef.current.resume().catch(() => undefined);
    } catch {
      // Audio is an enhancement only.
    }
  }

  function spinTone() {
    const context = audioRef.current;
    if (!context || !soundRef.current) return;
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(150, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(240, context.currentTime + 0.18);
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
    } catch {
      // Ignore unavailable audio without affecting the spin.
    }
  }

  function spin() {
    const engine = engineRef.current;
    if (!engine || !ready || busyRef.current || balance < bet) return;
    unlockAudio();

    const finalGrid = Array.from({ length: 5 }, () =>
      Array.from({ length: 3 }, () => pickSlotSymbol()),
    );
    const evaluated = evaluateSlot(finalGrid, bet);
    const result: Slot500xResult = { ...evaluated, stake: bet };
    if (!engine.start(finalGrid, result)) return;

    pendingRef.current = { grid: finalGrid, result };
    busyRef.current = true;
    setWin(0);
    setSpinning(true);
    setBalance((current) => Math.max(0, current - bet));
    spinTone();
  }

  function toggleSound() {
    setSound((current) => {
      const next = !current;
      soundRef.current = next;
      if (next) unlockAudio();
      return next;
    });
  }

  const status = spinning
    ? "REELS IN MOTION"
    : win >= bet * 25 && win > 0
      ? "JACKPOT CELEBRATION"
      : win >= bet * 8
        ? "BIG WIN"
        : win > 0
          ? "NICE WIN"
          : "READY TO SPIN";
  const gridDescription = grid.map((column, index) => `Reel ${index + 1}: ${column.join(", ")}`).join("; ");

  return (
    <section className="slot500x-machine" aria-label="500X demo slot">
      <header className="slot500x-heading">
        <div>
          <p>CANVAS TEMPLE · DEMO</p>
          <h2>500X</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSound} aria-label={sound ? "Mute 500X sound" : "Enable 500X sound"}>
          {sound ? <Volume2 /> : <VolumeX />}
        </Button>
      </header>

      <div className="slot500x-subhead">
        <span><Gem size={13} /> 5 REELS · 3 ROWS</span>
        <span>VIRTUAL COINS ONLY</span>
      </div>

      <div className="slot500x-stage">
        <canvas
          ref={canvasRef}
          className="slot500x-canvas"
          role="img"
          aria-label={`500X five-reel demo slot. ${gridDescription}`}
        >
          500X is a five-reel, three-row virtual demo slot.
        </canvas>
        {!ready && !error && <div className="slot500x-loading" role="status">POLISHING THE TEMPLE…</div>}
        {error && <div className="slot500x-loading" role="alert">{error}</div>}
      </div>

      <div className={`slot500x-result ${win > 0 ? "is-win" : ""}`} role="status" aria-live="polite">
        <span>{status}</span>
        <strong>{win > 0 ? `+${displayWin.toLocaleString()} coins` : spinning ? "Good luck" : "500X · DEMO"}</strong>
      </div>

      <div className="slot500x-meter">
        <div><span>DEMO BALANCE</span><strong>{balance.toLocaleString()}</strong></div>
        <div><span>LAST RESULT</span><strong>{win.toLocaleString()}</strong></div>
      </div>

      <div className="slot500x-controls">
        <Button variant="outline" size="icon" aria-label="Decrease 500X bet" disabled={spinning || bet <= 10} onClick={() => setBet((current) => Math.max(10, current - 10))}>
          <Minus />
        </Button>
        <div><span>BET · COINS</span><strong>{bet}</strong></div>
        <Button variant="outline" size="icon" aria-label="Increase 500X bet" disabled={spinning || bet >= 500} onClick={() => setBet((current) => Math.min(500, current + 10))}>
          <Plus />
        </Button>
        <Button className="slot500x-spin" onClick={spin} disabled={!ready || spinning || balance < bet || !!error}>
          <Zap />{spinning ? "SPINNING…" : "SPIN"}
        </Button>
      </div>

      {balance < bet && !spinning && (
        <Button variant="ghost" className="w-full" onClick={() => { setBalance(2000); setWin(0); }}>
          <RotateCcw /> Reset demo coins
        </Button>
      )}
      <p className="slot500x-rules">3+ matching symbols from the left · Garuda WILD substitutes · Existing demo paytable</p>
      <p className="slot500x-disclosure">500X is a mode name, not a promised multiplier. Bonus artwork is decorative; no free spins are awarded. Virtual coins have no cash value.</p>
    </section>
  );
}

export default Slot500xGame;
