import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plane, Zap, Clock, History, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { useVault } from "@/lib/vault-store";

// Audio Synthesizer for Aviator Engine, Takeoff, Cashout & Crash
const playAviatorAudio = (type: "takeoff" | "fly" | "cashout" | "crash") => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "takeoff") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(360, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === "cashout") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.2);
      });
    } else if (type === "crash") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // WebAudio fallback
  }
};

export function AviatorGame() {
  const { user, addScore } = useVault();

  // Primary Bet Deck
  const [betAmount, setBetAmount] = useState<number>(20);
  const [betActive, setBetActive] = useState<boolean>(false);
  const [hasCashedOut, setHasCashedOut] = useState<boolean>(false);
  const [cashedAmount, setCashedAmount] = useState<number>(0);

  // Secondary Bet Deck (1win Double Bet Feature)
  const [bet2Amount, setBet2Amount] = useState<number>(10);
  const [bet2Active, setBet2Active] = useState<boolean>(false);
  const [hasCashedOut2, setHasCashedOut2] = useState<boolean>(false);
  const [cashedAmount2, setCashedAmount2] = useState<number>(0);
  const [autoCashoutValue, setAutoCashoutValue] = useState<string>("2.00");
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState<boolean>(false);

  // Game Engine States
  const [gameState, setGameState] = useState<"idle" | "countdown" | "running" | "crashed">("idle");
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [countdown, setCountdown] = useState<number>(4);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // 1win Multiplier History
  const [history, setHistory] = useState<number[]>([1.34, 4.22, 1.08, 12.85, 2.15, 1.88, 7.40]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const crashPointRef = useRef<number>(1.0);
  const animFrameRef = useRef<any>(null);

  const generateCrashPoint = () => {
    const rand = Math.random();
    if (rand < 0.08) return 1.05;
    if (rand < 0.55) return parseFloat((1.2 + Math.random() * 1.5).toFixed(2));
    if (rand < 0.85) return parseFloat((2.8 + Math.random() * 4.2).toFixed(2));
    return parseFloat((7.0 + Math.random() * 18.0).toFixed(2));
  };

  const startNextRoundCountdown = () => {
    setGameState("countdown");
    setCountdown(4);
    setMultiplier(1.0);
    setHasCashedOut(false);
    setHasCashedOut2(false);
    setCashedAmount(0);
    setCashedAmount2(0);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          launchFlight();
          return 0;
        }
        return prev - 1;
      });
    }, 900);
  };

  const handlePlacePrimaryBet = () => {
    if (betActive) return;
    if (!user || user.balance < betAmount) {
      toast.error("Insufficient balance for Bet 1!");
      return;
    }
    addScore(-betAmount);
    setBetActive(true);
    setHasCashedOut(false);
    toast.success(`Bet 1 Placed: ₹${betAmount}`);

    if (gameState === "idle" || gameState === "crashed") {
      startNextRoundCountdown();
    }
  };

  const handlePlaceSecondaryBet = () => {
    if (bet2Active) return;
    if (!user || user.balance < bet2Amount) {
      toast.error("Insufficient balance for Bet 2!");
      return;
    }
    addScore(-bet2Amount);
    setBet2Active(true);
    setHasCashedOut2(false);
    toast.success(`Bet 2 Placed: ₹${bet2Amount}`);

    if (gameState === "idle" || gameState === "crashed") {
      startNextRoundCountdown();
    }
  };

  const launchFlight = () => {
    const crashAt = generateCrashPoint();
    crashPointRef.current = crashAt;
    setGameState("running");
    if (soundEnabled) playAviatorAudio("takeoff");

    const startTime = Date.now();

    const renderLoop = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Exponential curve calculation: slow take-off, accelerating high
      const current = parseFloat((1.00 + elapsed * 0.14 + Math.pow(elapsed * 0.08, 2.2)).toFixed(2));

      // Draw Red Trajectory Curve on Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          const progress = Math.min(1, elapsed / 8);
          const endX = 30 + progress * (w - 70);
          const endY = h - 25 - Math.pow(progress, 1.4) * (h - 70);

          // Path Gradient Fill under curve
          const grad = ctx.createLinearGradient(0, endY, 0, h);
          grad.addColorStop(0, "rgba(225, 29, 72, 0.45)");
          grad.addColorStop(1, "rgba(225, 29, 72, 0.0)");

          ctx.beginPath();
          ctx.moveTo(20, h - 20);
          ctx.quadraticCurveTo(endX * 0.5, h - 20, endX, endY);
          ctx.lineTo(endX, h - 20);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.fill();

          // Smooth Red Stroke
          ctx.beginPath();
          ctx.moveTo(20, h - 20);
          ctx.quadraticCurveTo(endX * 0.5, h - 20, endX, endY);
          ctx.strokeStyle = "#e11d48";
          ctx.lineWidth = 3.5;
          ctx.stroke();
        }
      }

      // Auto Cashout Check for Deck 2
      if (autoCashoutEnabled && bet2Active && !hasCashedOut2) {
        const target = parseFloat(autoCashoutValue);
        if (current >= target && target > 1.0) {
          cashOutDeck2(current);
        }
      }

      if (current >= crashPointRef.current) {
        // Plane Flew Away
        const finalCrash = crashPointRef.current;
        setMultiplier(finalCrash);
        setGameState("crashed");
        setBetActive(false);
        setBet2Active(false);
        if (soundEnabled) playAviatorAudio("crash");

        setHistory((prev) => [finalCrash, ...prev.slice(0, 8)]);
        cancelAnimationFrame(animFrameRef.current);
      } else {
        setMultiplier(current);
        animFrameRef.current = requestAnimationFrame(renderLoop);
      }
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);
  };

  const cashOutDeck1 = () => {
    if (gameState !== "running" || !betActive || hasCashedOut) return;
    const payout = Math.round(betAmount * multiplier);
    addScore(payout);
    setHasCashedOut(true);
    setCashedAmount(payout);
    setBetActive(false);
    if (soundEnabled) playAviatorAudio("cashout");
    toast.success(`🎉 CASHOUT! Won ₹${payout} (${multiplier.toFixed(2)}x)`);
  };

  const cashOutDeck2 = (overrideMulti?: number) => {
    if (gameState !== "running" || !bet2Active || hasCashedOut2) return;
    const activeMulti = overrideMulti || multiplier;
    const payout = Math.round(bet2Amount * activeMulti);
    addScore(payout);
    setHasCashedOut2(true);
    setCashedAmount2(payout);
    setBet2Active(false);
    if (soundEnabled) playAviatorAudio("cashout");
    toast.success(`🎉 DECK 2 CASHOUT! Won ₹${payout} (${activeMulti.toFixed(2)}x)`);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-[#0a0d14] p-3 shadow-2xl font-sans select-none text-slate-100">
      
      {/* Top Bar with History & Audio */}
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <History className="size-3.5 text-slate-500 shrink-0" />
          {history.map((val, idx) => (
            <span
              key={idx}
              className={`rounded-full px-2 py-0.5 text-[9px] font-mono font-black shrink-0 ${
                val >= 10
                  ? "bg-rose-600/30 text-rose-400 border border-rose-500/40"
                  : val >= 2
                  ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                  : "bg-blue-600/20 text-blue-300 border border-blue-500/30"
              }`}
            >
              {val.toFixed(2)}x
            </span>
          ))}
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="rounded-lg border border-slate-800 bg-[#121826] p-1.5 text-slate-400 hover:text-white"
        >
          {soundEnabled ? <Volume2 className="size-3.5 text-rose-500" /> : <VolumeX className="size-3.5" />}
        </button>
      </div>

      {/* Flight Canvas Radar Arena */}
      <div className="relative flex h-56 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-800/90 bg-[#080b12] shadow-inner">
        
        {/* Trajectory Canvas */}
        <canvas
          ref={canvasRef}
          width={400}
          height={220}
          className="absolute inset-0 h-full w-full pointer-events-none z-10"
        />

        {/* Center Multiplier HUD */}
        <div className="z-20 text-center">
          {gameState === "countdown" ? (
            <div className="animate-pulse">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Next Round Starting In
              </span>
              <span className="text-4xl font-black text-amber-300 font-mono drop-shadow-[0_0_15px_#f59e0b]">
                {countdown}s
              </span>
            </div>
          ) : (
            <>
              <div
                className={`text-5xl font-black tracking-tight font-mono transition-all ${
                  gameState === "crashed"
                    ? "text-rose-600 scale-105"
                    : "text-white drop-shadow-[0_0_20px_rgba(244,63,94,0.7)]"
                }`}
              >
                {multiplier.toFixed(2)}x
              </div>

              {gameState === "crashed" && (
                <p className="mt-1 text-[11px] font-black uppercase tracking-widest text-rose-500 animate-pulse">
                  FLEW AWAY @ {crashPointRef.current.toFixed(2)}x
                </p>
              )}
            </>
          )}
        </div>

        {/* Animated Flying Red Jet */}
        {gameState === "running" && (
          <div
            className="absolute z-20 transition-all duration-75 ease-out pointer-events-none"
            style={{
              bottom: `${Math.min(75, 12 + Math.log(multiplier) * 28)}%`,
              left: `${Math.min(78, 12 + Math.log(multiplier) * 26)}%`,
            }}
          >
            <div className="relative">
              <Plane className="size-10 text-rose-500 -rotate-12 fill-rose-600 drop-shadow-[0_0_15px_#f43f5e]" />
              <div className="absolute -bottom-0.5 -left-3 h-1 w-6 rounded-full bg-amber-400 blur-[1px] animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* 1win Authentic Dual Bet Deck */}
      <div className="mt-3 grid grid-cols-1 gap-2.5">
        
        {/* Panel 1: Primary Stake & Cashout */}
        <div className="rounded-2xl border border-slate-800 bg-[#0f1422] p-2.5 space-y-2 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Bet Panel 1</span>
            {hasCashedOut && (
              <span className="text-[10px] font-black text-emerald-400">Cashed: ₹{cashedAmount}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[20, 50, 100, 200].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={betActive || gameState === "running"}
                  onClick={() => setBetAmount(amt)}
                  className={`h-7 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                    betAmount === amt
                      ? "bg-rose-600 border-rose-500 text-white"
                      : "bg-[#141b29] border-slate-800 text-slate-300"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {gameState === "running" && betActive && !hasCashedOut ? (
              <Button
                type="button"
                onClick={cashOutDeck1}
                className="flex-1 h-9 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 animate-pulse"
              >
                Cash Out ₹{Math.round(betAmount * multiplier)}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handlePlacePrimaryBet}
                disabled={betActive}
                className={`flex-1 h-9 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                  betActive
                    ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                }`}
              >
                {betActive ? "Waiting..." : `Bet ₹${betAmount}`}
              </Button>
            )}
          </div>
        </div>

        {/* Panel 2: Secondary Stake & Auto Cashout */}
        <div className="rounded-2xl border border-slate-800 bg-[#0f1422] p-2.5 space-y-2 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Bet Panel 2 (Auto)</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-slate-400">Auto:</span>
              <button
                type="button"
                onClick={() => setAutoCashoutEnabled(!autoCashoutEnabled)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${
                  autoCashoutEnabled
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-[#141b29] border-slate-800 text-slate-400"
                }`}
              >
                {autoCashoutEnabled ? "ON" : "OFF"}
              </button>
              <input
                type="number"
                step="0.1"
                min="1.1"
                value={autoCashoutValue}
                onChange={(e) => setAutoCashoutValue(e.target.value)}
                className="w-12 h-6 rounded bg-[#141b29] border border-slate-800 text-[10px] font-mono text-center text-amber-300 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[10, 25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={bet2Active || gameState === "running"}
                  onClick={() => setBet2Amount(amt)}
                  className={`h-7 px-2 rounded-lg text-[10px] font-bold border transition-all ${
                    bet2Amount === amt
                      ? "bg-purple-600 border-purple-500 text-white"
                      : "bg-[#141b29] border-slate-800 text-slate-300"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {gameState === "running" && bet2Active && !hasCashedOut2 ? (
              <Button
                type="button"
                onClick={() => cashOutDeck2()}
                className="flex-1 h-9 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 animate-pulse"
              >
                Cash Out ₹{Math.round(bet2Amount * multiplier)}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handlePlaceSecondaryBet}
                disabled={bet2Active}
                className={`flex-1 h-9 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                  bet2Active
                    ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                }`}
              >
                {bet2Active ? "Waiting..." : `Bet ₹${bet2Amount}`}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AviatorGame;
    
