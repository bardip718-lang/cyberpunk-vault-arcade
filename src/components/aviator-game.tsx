import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Plane } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";

type GamePhase = "WAITING" | "FLYING" | "CRASHED";

interface BetDeck {
  amount: number;
  active: boolean;
  queued: boolean;
  cashedOut: boolean;
  cashedAmount: number;
}

export function AviatorGame() {
  const { user, addScore } = useVault();

  const [phase, setPhase] = useState<GamePhase>("WAITING");
  const [multiplier, setMultiplier] = useState(1.0);
  const [countdown, setCountdown] = useState(5);
  const [sound, setSound] = useState(true);
  const [history, setHistory] = useState<number[]>([1.34, 4.22, 1.08, 12.85, 2.15, 1.04]);

  const [deck1, setDeck1] = useState<BetDeck>({
    amount: 50,
    active: false,
    queued: false,
    cashedOut: false,
    cashedAmount: 0,
  });

  const [deck2, setDeck2] = useState<BetDeck>({
    amount: 50,
    active: false,
    queued: false,
    cashedOut: false,
    cashedAmount: 0,
  });

  // State refs to prevent stale closures and freeze bugs
  const phaseRef = useRef<GamePhase>("WAITING");
  phaseRef.current = phase;

  const currentMultiRef = useRef(1.0);
  const crashPointRef = useRef(1.5);
  const userRef = useRef(user);
  userRef.current = user;

  const deck1Ref = useRef(deck1);
  deck1Ref.current = deck1;
  const deck2Ref = useRef(deck2);
  deck2Ref.current = deck2;

  // Sound Engine
  const playAudio = (type: "cashout" | "crash") => {
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
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === "crash") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {}
  };

  const getNextCrash = (): number => {
    const r = Math.random();
    if (r < 0.15) return +(1.02 + Math.random() * 0.15).toFixed(2);
    if (r < 0.65) return +(1.2 + Math.random() * 0.8).toFixed(2);
    if (r < 0.9) return +(2.0 + Math.random() * 2.5).toFixed(2);
    return +(5.0 + Math.random() * 7.0).toFixed(2);
  };

  // Robust Master Game Loop (Will Never Get Stuck)
  useEffect(() => {
    let tickTimer: ReturnType<typeof setInterval>;

    tickTimer = setInterval(() => {
      if (phaseRef.current === "WAITING") {
        setCountdown((cd) => {
          if (cd <= 1) {
            // Deduct balance for queued bets
            const d1 = deck1Ref.current;
            const d2 = deck2Ref.current;
            const currentBal = userRef.current?.balance ?? 0;

            let totalDeduct = 0;
            const d1ShouldActive = d1.queued && currentBal >= d1.amount;
            if (d1ShouldActive) totalDeduct += d1.amount;

            const d2ShouldActive = d2.queued && currentBal - totalDeduct >= d2.amount;
            if (d2ShouldActive) totalDeduct += d2.amount;

            if (totalDeduct > 0) {
              addScore(-totalDeduct);
            }

            setDeck1((prev) => ({
              ...prev,
              active: d1ShouldActive,
              queued: false,
              cashedOut: false,
            }));

            setDeck2((prev) => ({
              ...prev,
              active: d2ShouldActive,
              queued: false,
              cashedOut: false,
            }));

            crashPointRef.current = getNextCrash();
            currentMultiRef.current = 1.0;
            setMultiplier(1.0);
            setPhase("FLYING");
            return 5;
          }
          return cd - 1;
        });
      } else if (phaseRef.current === "FLYING") {
        // Multiplier progression
        const step = currentMultiRef.current < 2 ? 0.02 : currentMultiRef.current < 5 ? 0.05 : 0.09;
        const next = +(currentMultiRef.current + step).toFixed(2);
        currentMultiRef.current = next;
        setMultiplier(next);

        // Crash condition
        if (next >= crashPointRef.current) {
          setMultiplier(crashPointRef.current);
          setPhase("CRASHED");
          playAudio("crash");
          setHistory((h) => [crashPointRef.current, ...h.slice(0, 5)]);

          // Uncashed active bets are cleared
          setDeck1((prev) => ({ ...prev, active: false }));
          setDeck2((prev) => ({ ...prev, active: false }));

          // Always reset to WAITING after 2 seconds
          setTimeout(() => {
            setPhase("WAITING");
          }, 2000);
        }
      }
    }, 90);

    return () => clearInterval(tickTimer);
  }, [addScore]);

  // Handle Bet Click (Waiting: Direct toggle | Flying: Queue for next)
  const handleBetToggle = (deckNum: 1 | 2) => {
    const deck = deckNum === 1 ? deck1 : deck2;
    const setDeck = deckNum === 1 ? setDeck1 : setDeck2;
    const currentBal = user?.balance ?? 0;

    if (deck.queued) {
      setDeck((d) => ({ ...d, queued: false }));
      toast.info(`Panel ${deckNum} bet removed`);
      return;
    }

    if (currentBal < deck.amount) {
      toast.error("Insufficient Balance!");
      return;
    }

    setDeck((d) => ({ ...d, queued: true }));
    toast.success(`Panel ${deckNum} bet set for round`);
  };

  // Cashout Action
  const handleCashout = (deckNum: 1 | 2) => {
    if (phase !== "FLYING") return;

    const deck = deckNum === 1 ? deck1 : deck2;
    const setDeck = deckNum === 1 ? setDeck1 : setDeck2;

    if (!deck.active || deck.cashedOut) return;

    const win = Math.round(deck.amount * currentMultiRef.current);
    addScore(win);
    playAudio("cashout");

    setDeck((d) => ({
      ...d,
      active: false,
      cashedOut: true,
      cashedAmount: win,
    }));

    toast.success(`🎉 Won ₹${win} (${currentMultiRef.current.toFixed(2)}x)`);
  };

  // Trajectory calculations for plane SVG
  const planeProgress = Math.min(1, Math.max(0, (multiplier - 1) / 3));
  const planeX = 15 + planeProgress * 65;
  const planeY = 82 - planeProgress * 60;

  return (
    <div className="relative mx-auto flex w-full max-w-[380px] flex-col overflow-hidden rounded-3xl border-4 border-[#1e293b] bg-[#0b0e14] shadow-2xl font-sans select-none text-slate-100 pb-2">
      {/* Top History Bar */}
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
      <div className="relative mx-3 mt-2 h-56 overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-[#0f1422] to-[#080a10]">
        {/* Waiting Countdown */}
        {phase === "WAITING" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-20">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Next Flight In
            </span>
            <span className="font-mono text-4xl font-black text-amber-400 animate-pulse mt-1">
              {countdown}s
            </span>
          </div>
        )}

        {/* Flying Canvas & Red Jet */}
        {phase === "FLYING" && (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <span className="font-mono text-5xl font-black text-white tracking-tight drop-shadow-[0_0_20px_rgba(239,68,68,0.7)]">
                {multiplier.toFixed(2)}x
              </span>
            </div>

            {/* Flight Arc & Red Jet */}
            <svg className="absolute inset-0 size-full pointer-events-none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="curveGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <path
                d={`M 10 90 Q ${planeX * 0.6} 85 ${planeX} ${planeY}`}
                fill="none"
                stroke="url(#curveGrad)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>

            {/* Dynamic Spribe Plane */}
            <div
              className="absolute z-20 transition-all duration-75 flex items-center justify-center text-red-500 drop-shadow-[0_0_12px_#ef4444]"
              style={{
                left: `${planeX}%`,
                top: `${planeY}%`,
                transform: "translate(-50%, -50%) rotate(-15deg)",
              }}
            >
              <Plane className="size-8 fill-red-600 stroke-red-300" />
            </div>
          </>
        )}

        {/* Flew Away Screen */}
        {phase === "CRASHED" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-[1px] z-20">
            <span className="font-display text-sm font-black tracking-widest text-red-500 uppercase">
              FLEW AWAY!
            </span>
            <span className="font-mono text-4xl font-black text-red-400 mt-1">
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

              {/* Bet Amount Selector */}
              <div className="flex items-center gap-1">
                {[50, 100, 200, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={deck.active || deck.queued}
                    onClick={() => setDeck((d) => ({ ...d, amount: val }))}
                    className={`flex-1 rounded py-1 text-[10px] font-black transition-colors ${
                      deck.amount === val
                        ? "bg-rose-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    } disabled:opacity-40`}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
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
                  onClick={() => handleBetToggle(num as 1 | 2)}
                  className={`w-full rounded-lg py-3 text-center font-display text-sm font-black transition-all ${
                    deck.queued
                      ? "bg-rose-700 text-white hover:bg-rose-600 active:scale-95"
                      : "bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95"
                  }`}
                >
                  {deck.queued ? "CANCEL (QUEUED)" : `BET ₹${deck.amount}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const CrashGame = AviatorGame;
export default AviatorGame;
          
