import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plane, Zap, Flame, ShieldAlert, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useVault } from "@/lib/vault-store";
import { SoundFX } from "@/lib/sound-fx";

export function AviatorGame() {
  const { user, addScore } = useVault();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [gameState, setGameState] = useState<"idle" | "running" | "crashed">("idle");
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [hasCashedOut, setHasCashedOut] = useState<boolean>(false);
  const [cashoutGain, setCashoutGain] = useState<number>(0);

  const crashPointRef = useRef<number>(1.0);
  const animFrameRef = useRef<any>(null);
  const soundTickRef = useRef<number>(0);

  // Generate weighted crash point (fair casino curve)
  const generateCrashPoint = () => {
    const rand = Math.random();
    if (rand < 0.08) return 1.0; // Instant bust (house edge)
    if (rand < 0.6) return parseFloat((1.1 + Math.random() * 1.5).toFixed(2)); // 1.1x - 2.6x
    if (rand < 0.88) return parseFloat((2.6 + Math.random() * 4.0).toFixed(2)); // 2.6x - 6.6x
    return parseFloat((6.6 + Math.random() * 15.0).toFixed(2)); // High roller jackpot
  };

  const startFlight = () => {
    if (gameState === "running") return;

    if (!user || user.balance < betAmount) {
      toast.error("Insufficient balance to place bet!");
      return;
    }

    // Deduct bet from vault
    addScore(-betAmount);
    SoundFX.click();

    const crashAt = generateCrashPoint();
    crashPointRef.current = crashAt;

    setGameState("running");
    setMultiplier(1.0);
    setHasCashedOut(false);
    setCashoutGain(0);
    soundTickRef.current = 0;

    let current = 1.0;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Exponential curve like standard Aviator
      current = parseFloat((1.0 + Math.pow(elapsed * 0.55, 1.8)).toFixed(2));

      // Sound audio sync on engine ascent
      soundTickRef.current++;
      if (soundTickRef.current % 15 === 0) {
        SoundFX.flightAscend(current);
      }

      if (current >= crashPointRef.current) {
        // Plane Crashed / Flew Away
        setMultiplier(crashPointRef.current);
        setGameState("crashed");
        SoundFX.blast();
        cancelAnimationFrame(animFrameRef.current);
      } else {
        setMultiplier(current);
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  };

  const handleCashout = () => {
    if (gameState !== "running" || hasCashedOut) return;

    const winAmount = Math.round(betAmount * multiplier);
    addScore(winAmount);
    setHasCashedOut(true);
    setCashoutGain(winAmount);

    if (multiplier >= 5) {
      SoundFX.bigWin();
    } else {
      SoundFX.win();
    }

    toast.success(`🚀 CASHOUT SUCCESS! +₹${winAmount} (${multiplier}x)`);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-rose-500/30 bg-slate-950 p-4 sm:p-6 shadow-2xl">
      {/* Title Bar */}
      <div className="mb-4 flex items-center justify-between border-b border-rose-500/20 pb-3">
        <div className="flex items-center gap-2">
          <Plane className="size-6 text-rose-500 animate-pulse" />
          <h2 className="font-display text-xl font-black tracking-wider text-rose-400">
            AVIATOR CRASH
          </h2>
        </div>
        <span className="rounded bg-rose-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-rose-300 border border-rose-500/30">
          PROVABLY FAIR
        </span>
      </div>

      {/* Radar Flight Canvas Arena */}
      <div className="relative flex h-64 sm:h-72 w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-rose-950 bg-gradient-to-b from-[#18080a] via-[#0f0406] to-[#080203] p-4 shadow-inner">
        {/* Radar Circular Background Lines */}
        <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
          <div className="size-48 rounded-full border border-rose-500" />
          <div className="absolute size-72 rounded-full border border-rose-500" />
          <div className="absolute h-full w-[1px] bg-rose-500" />
          <div className="absolute w-full h-[1px] bg-rose-500" />
        </div>

        {/* Multiplier Center Display */}
        <div className="z-10 text-center">
          <div
            className={`font-display text-5xl sm:text-6xl font-black tracking-tight ${
              gameState === "crashed"
                ? "text-rose-600 scale-105 transition-transform"
                : "text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]"
            }`}
          >
            {multiplier.toFixed(2)}x
          </div>

          {gameState === "crashed" && (
            <p className="mt-2 font-display text-xs font-bold uppercase tracking-widest text-rose-500 animate-pulse">
              FLEW AWAY @ {crashPointRef.current.toFixed(2)}x
            </p>
          )}

          {hasCashedOut && (
            <div className="mt-2 rounded-lg bg-emerald-500/20 px-3 py-1 border border-emerald-500/40 text-emerald-400 font-bold text-xs animate-bounce">
              Cashed Out: ₹{cashoutGain}
            </div>
          )}
        </div>

        {/* Animated Jet in Flight */}
        {gameState === "running" && (
          <div
            className="absolute z-20 flex items-center gap-2 transition-all duration-75"
            style={{
              bottom: `${Math.min(75, 20 + Math.log(multiplier) * 30)}%`,
              left: `${Math.min(75, 15 + Math.log(multiplier) * 28)}%`,
            }}
          >
            <div className="relative">
              <Plane className="size-10 text-rose-400 -rotate-12 fill-rose-500 drop-shadow-[0_0_15px_#f43f5e]" />
              <div className="absolute -bottom-1 -left-4 h-1.5 w-6 rounded-full bg-amber-400 blur-[1px] animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Stake Amount (₹)</span>
          <div className="flex items-center gap-1.5">
            {[10, 25, 50, 100, 250].map((amt) => (
              <Button
                key={amt}
                size="sm"
                type="button"
                variant={betAmount === amt ? "default" : "outline"}
                onClick={() => setBetAmount(amt)}
                className={`h-7 px-2.5 text-xs font-bold font-mono ${
                  betAmount === amt ? "bg-rose-500 text-white" : "border-rose-900/50 text-slate-300"
                }`}
              >
                ₹{amt}
              </Button>
            ))}
          </div>
        </div>

        {gameState === "running" && !hasCashedOut ? (
          <Button
            type="button"
            onClick={handleCashout}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 py-6 font-display text-lg font-black tracking-wider uppercase text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95 transition-all"
          >
            CASHOUT ₹{Math.round(betAmount * multiplier)} ({multiplier.toFixed(2)}x)
          </Button>
        ) : (
          <Button
            type="button"
            onClick={startFlight}
            disabled={gameState === "running"}
            className="w-full bg-gradient-to-r from-rose-500 via-red-600 to-rose-700 py-6 font-display text-base font-black tracking-widest uppercase text-white shadow-[0_0_25px_rgba(244,63,94,0.4)] active:scale-95 transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              <Zap className="size-5 fill-white" /> BET ₹{betAmount} &amp; FLY
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}

export default AviatorGame;
                  
