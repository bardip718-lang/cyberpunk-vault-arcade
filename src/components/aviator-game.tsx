import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";

type GamePhase = "WAITING" | "FLYING" | "CRASHED";

interface BetDeck {
  amount: number;
  active: boolean;
  queuedForNext: boolean;
  cashedOut: boolean;
  cashedAmount: number;
  autoCashout: boolean;
  autoTarget: number;
}

export function CrashGame() {
  const { user, addScore } = useVault();

  const [phase, setPhase] = useState<GamePhase>("WAITING");
  const [multiplier, setMultiplier] = useState(1.0);
  const [countdown, setCountdown] = useState(5);
  const [sound, setSound] = useState(true);
  const [history, setHistory] = useState<number[]>([1.34, 4.22, 1.08, 12.85, 2.15, 1.18]);

  const [deck1, setDeck1] = useState<BetDeck>({
    amount: 200,
    active: false,
    queuedForNext: false,
    cashedOut: false,
    cashedAmount: 0,
    autoCashout: false,
    autoTarget: 2.0,
  });

  const [deck2, setDeck2] = useState<BetDeck>({
    amount: 100,
    active: false,
    queuedForNext: false,
    cashedOut: false,
    cashedAmount: 0,
    autoCashout: false,
    autoTarget: 2.0,
  });

  const crashTargetRef = useRef(1.0);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const generateCrashPoint = (): number => {
    const rand = Math.random();
    if (rand < 0.10) return +(1.00 + Math.random() * 0.1).toFixed(2);
    if (rand < 0.60) return +(1.1 + Math.random() * 0.89).toFixed(2);
    if (rand < 0.90) return +(2.0 + Math.random() * 2.99).toFixed(2);
    return +(5.0 + Math.random() * 10.0).toFixed(2);
  };

  const playFx = (type: "cashout" | "crash") => {
    if (!sound) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "cashout") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "crash") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {}
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "WAITING") {
      setCountdown(5);
      setMultiplier(1.0);

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);

            setDeck1((d1) => {
              if (d1.queuedForNext) {
                if ((user?.balance ?? 0) >= d1.amount) {
                  addScore(-d1.amount);
                  return { ...d1, active: true, queuedForNext: false, cashedOut: false };
                } else {
                  toast.error("Panel 1: Insufficient Balance!");
                  return { ...d1, active: false, queuedForNext: false };
                }
              }
              return d1;
            });

            setDeck2((d2) => {
              if (d2.queuedForNext) {
                if ((user?.balance ?? 0) >= d2.amount) {
                  addScore(-d2.amount);
                  return { ...d2, active: true, queuedForNext: false, cashedOut: false };
                } else {
                  toast.error("Panel 2: Insufficient Balance!");
                  return { ...d2, active: false, queuedForNext: false };
                }
              }
              return d2;
            });

            crashTargetRef.current = generateCrashPoint();
            setPhase("FLYING");
            startTimeRef.current = performance.now();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }

    if (phase === "FLYING") {
      const loop = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const currentMulti = +(1.0 + Math.pow(elapsed / 3000, 1.9)).toFixed(2);

        if (currentMulti >= crashTargetRef.current) {
          setMultiplier(crashTargetRef.current);
          setPhase("CRASHED");
          playFx("crash");

          setHistory((h) => [crashTargetRef.current, ...h.slice(0, 5)]);

          setDeck1((d) => ({ ...d, active: false }));
          setDeck2((d) => ({ ...d, active: false }));

          timer = setTimeout(() => {
            setPhase("WAITING");
          }, 2500);
          return;
        }

        setMultiplier(currentMulti);

        setDeck1((d) => {
          if (d.active && !d.cashedOut && d.autoCashout && currentMulti >= d.autoTarget) {
            const win = Math.round(d.amount * d.autoTarget);
            addScore(win);
            playFx("cashout");
            toast.success(`🎉 Panel 1 Auto-Cashout: +₹${win}`);
            return { ...d, active: false, cashedOut: true, cashedAmount: win };
          }
          return d;
        });

        setDeck2((d) => {
          if (d.active && !d.cashedOut && d.autoCashout && currentMulti >= d.autoTarget) {
            const win = Math.round(d.amount * d.autoTarget);
            addScore(win);
            playFx("cashout");
            toast.success(`🎉 Panel 2 Auto-Cashout: +₹${win}`);
            return { ...d, active: false, cashedOut: true, cashedAmount: win };
          }
          return d;
        });

        animationFrameRef.current = requestAnimationFrame(loop);
      };

      animationFrameRef.current = requestAnimationFrame(loop);

      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        clearTimeout(timer);
      };
    }
  }, [phase]);

  const handleBetClick = (deckNum: 1 | 2) => {
    const deck = deckNum === 1 ? deck1 : deck2;
    const setDeck = deckNum === 1 ? setDeck1 : setDeck2;

    if (phase === "WAITING") {
      if (deck.queuedForNext || deck.active) {
        setDeck((d) => ({ ...d, queuedForNext: false, active: false }));
      } else {
        if ((user?.balance ?? 0) < deck.amount) {
          toast.error("Insufficient Balance!");
          return;
        }
        setDeck((d) => ({ ...d, queuedForNext: true }));
      }
    } else {
      if (deck.queuedForNext) {
        setDeck((d) => ({ ...d, queuedForNext: false }));
        toast.info("Next round bet cancelled");
      } else {
        if ((user?.balance ?? 0) < deck.amount) {
          toast.error("Insufficient Balance!");
          return;
        }
        setDeck((d) => ({ ...d, queuedForNext: true }));
        toast.info("Bet queued for next round");
      }
    }
  };

  const handleCashout = (deckNum: 1 | 2) => {
    if (phase !== "FLYING") return;

    const deck = deckNum === 1 ? deck1 : deck2;
    const setDeck = deckNum === 1 ? setDeck1 : setDeck2;

    if (!deck.active || deck.cashedOut) return;

    const win = Math.round(deck.amount * multiplier);
    addScore(win);
    playFx("cashout");

    setDeck((d) => ({
      ...d,
      active: false,
      cashedOut: true,
      cashedAmount: win,
    }));

    toast.success(`🎉 Panel ${deckNum} Cashed Out: +₹${win} (${multiplier.toFixed(2)}x)`);
  };

  return (
    <div className="relative mx-auto flex w-full max-w-[380px] flex-col overflow-hidden rounded-3xl border-4 border-[#1e293b] bg-[#0b0e14] shadow-2xl font-sans select-none text-slate-100 pb-2">
      
      {/* Top Multiplier History */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#0f141c] px-3 py-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {history.map((h, i) => (
            <span
              key={i}
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-black ${
                h >= 10
                  ? "bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-700"
                  : h >= 2
                  ? "bg-purple-950 text-purple-400 border border-purple-700"
                  : "bg-blue-950 text-blue-400 border border-blue-800"
              }`}
            >
              {h.toFixed(2)}x
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSound(!sound)}
          className="text-slate-400 hover:text-white"
        >
          {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </button>
      </div>

      {/* Flight Radar Screen */}
      <div className="relative mx-3 mt-2 h-52 overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#0f1422] to-[#080a10]">
        
        {phase === "WAITING" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Next Round In
            </span>
            <span className="font-mono text-4xl font-black text-amber-400 animate-pulse">
              {countdown}s
            </span>
          </div>
        )}

        {phase === "FLYING" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-5xl font-black text-white tracking-tight drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              {multiplier.toFixed(2)}x
            </span>
            <svg className="absolute inset-0 size-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path
                d="M 5 95 Q 40 90 90 25"
                fill="none"
                stroke="#ef4444"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}

        {phase === "CRASHED" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/25 backdrop-blur-[1px]">
            <span className="font-display text-base font-black tracking-widest text-red-500 uppercase">
              FLEW AWAY!
            </span>
            <span className="font-mono text-4xl font-black text-red-400">
              {multiplier.toFixed(2)}x
            </span>
          </div>
        )}
      </div>

      {/* Bet Panels */}
      <div className="mt-2 flex flex-col gap-2 px-3">
        {[1, 2].map((num) => {
          const isDeck1 = num === 1;
          const deck = isDeck1 ? deck1 : deck2;
          const setDeck = isDeck1 ? setDeck1 : setDeck2;

          const isFlying = phase === "FLYING";
          const canCashout = isFlying && deck.active && !deck.cashedOut;

          return (
            <div
              key={num}
              className="rounded-xl border border-slate-800 bg-[#121824] p-2 flex flex-col gap-1.5 shadow-inner"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>BET PANEL {num}</span>
                {deck.cashedOut && (
                  <span className="font-mono text-emerald-400">
                    Won: ₹{deck.cashedAmount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {[50, 100, 200, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={deck.active || deck.queuedForNext}
                    onClick={() => setDeck((d) => ({ ...d, amount: val }))}
                    className={`flex-1 rounded py-1 text-[10px] font-black transition-colors ${
                      deck.amount === val
                        ? "bg-rose-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    } disabled:opacity-50`}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>

              {canCashout ? (
                <button
                  type="button"
                  onClick={() => handleCashout(num as 1 | 2)}
                  className="w-full rounded-lg bg-amber-500 py-3 text-center font-display text-sm font-black text-slate-950 shadow-[0_0_15px_#f59e0b] active:scale-95 transition-transform"
                >
                  CASH OUT ₹{Math.round(deck.amount * multiplier)}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleBetClick(num as 1 | 2)}
                  className={`w-full rounded-lg py-3 text-center font-display text-sm font-black transition-all ${
                    deck.queuedForNext
                      ? "bg-rose-700 text-white hover:bg-rose-600"
                      : "bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95"
                  }`}
                >
                  {deck.queuedForNext
                    ? "CANCEL (QUEUED)"
                    : phase === "WAITING"
                    ? `BET ₹${deck.amount}`
                    : `BET ₹${deck.amount} (NEXT ROUND)`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CrashGame;
                                            
