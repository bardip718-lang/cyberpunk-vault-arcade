import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Zap, RefreshCw, Flame, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { useVault } from "@/lib/vault-store";

// Web Audio synthesizer for realistic clicks & jingles
const playArcadeTone = (type: "spin" | "stop" | "win" | "bigwin") => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "spin") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "stop") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === "win") {
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
    } else if (type === "bigwin") {
      [440, 554, 659, 880, 1108, 1318].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.09);
        osc.stop(ctx.currentTime + i * 0.09 + 0.25);
      });
    }
  } catch {
    // Audio context error handle
  }
};

// Realistic 3D SVG Gemstone Graphics
function GemGraphic({ id }: { id: string }) {
  if (id === "garuda") {
    return (
      <div className="relative flex flex-col items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]">
          <defs>
            <linearGradient id="goldMask" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          <path d="M50 5 L85 25 L85 75 L50 95 L15 75 L15 25 Z" fill="url(#goldMask)" stroke="#fef08a" strokeWidth="2" />
          <circle cx="35" cy="40" r="6" fill="#dc2626" stroke="#fff" strokeWidth="1" />
          <circle cx="65" cy="40" r="6" fill="#dc2626" stroke="#fff" strokeWidth="1" />
          <path d="M40 65 Q50 78 60 65" stroke="#78350f" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
        <span className="text-[9px] font-black tracking-widest text-yellow-300 uppercase mt-0.5">WILD</span>
      </div>
    );
  }

  if (id === "red_gem") {
    return (
      <div className="relative flex flex-col items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]">
          <defs>
            <linearGradient id="rubyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fca5a5" />
              <stop offset="40%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#450a0a" />
            </linearGradient>
          </defs>
          <polygon points="50,10 88,38 74,88 26,88 12,38" fill="url(#rubyGrad)" stroke="#f87171" strokeWidth="2" />
          <polygon points="50,22 75,42 65,75 35,75 25,42" fill="#ef4444" opacity="0.6" />
        </svg>
        <span className="text-[9px] font-black tracking-widest text-rose-300 uppercase mt-0.5">RUBY</span>
      </div>
    );
  }

  if (id === "blue_gem") {
    return (
      <div className="relative flex flex-col items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-[0_0_12px_rgba(59,130,246,0.9)]">
          <defs>
            <linearGradient id="sapphGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="40%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#172554" />
            </linearGradient>
          </defs>
          <polygon points="50,8 92,50 50,92 8,50" fill="url(#sapphGrad)" stroke="#60a5fa" strokeWidth="2" />
          <polygon points="50,25 75,50 50,75 25,50" fill="#3b82f6" opacity="0.6" />
        </svg>
        <span className="text-[9px] font-black tracking-widest text-blue-300 uppercase mt-0.5">SAPPHIRE</span>
      </div>
    );
  }

  if (id === "green_gem") {
    return (
      <div className="relative flex flex-col items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]">
          <defs>
            <linearGradient id="emGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="40%" stopColor="#059669" />
              <stop offset="100%" stopColor="#022c22" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="38" fill="url(#emGrad)" stroke="#34d399" strokeWidth="2" />
          <circle cx="45" cy="45" r="22" fill="#10b981" opacity="0.5" />
        </svg>
        <span className="text-[9px] font-black tracking-widest text-emerald-300 uppercase mt-0.5">EMERALD</span>
      </div>
    );
  }

  if (id === "ten") {
    return (
      <div className="flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-black text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          10
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <span className="font-display text-2xl font-black text-cyan-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        J
      </span>
    </div>
  );
}

const SYMBOLS = [
  { id: "garuda", pay: 20 },
  { id: "red_gem", pay: 10 },
  { id: "blue_gem", pay: 6 },
  { id: "green_gem", pay: 4 },
  { id: "ten", pay: 2 },
  { id: "jack", pay: 2 },
];

const MULTIPLIERS = [1, 2, 3, 5, 10, 15];

export function FortuneGemsGame() {
  const { user, addScore } = useVault();

  const [betAmount, setBetAmount] = useState<number>(5);
  const [isSpinning, setIsSpinning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [bigWinOverlay, setBigWinOverlay] = useState<{ active: boolean; amount: number; multi: number }>({
    active: false,
    amount: 0,
    multi: 1,
  });

  const [grid, setGrid] = useState<string[][]>([
    ["garuda", "red_gem", "blue_gem"],
    ["red_gem", "garuda", "green_gem"],
    ["blue_gem", "green_gem", "ten"],
  ]);
  const [activeMultiplier, setActiveMultiplier] = useState<number>(1);
  const [lastWin, setLastWin] = useState<number>(0);
  const animTimerRef = useRef<any>(null);

  const pickRandomSymbol = () => {
    const rand = Math.random();
    if (rand < 0.1) return "garuda";
    if (rand < 0.25) return "red_gem";
    if (rand < 0.45) return "blue_gem";
    if (rand < 0.65) return "green_gem";
    if (rand < 0.85) return "ten";
    return "jack";
  };

  const handleSpin = () => {
    if (isSpinning) return;

    if (!user || user.balance < betAmount) {
      toast.error("Insufficient vault score balance! Please deposit.");
      return;
    }

    setBigWinOverlay({ active: false, amount: 0, multi: 1 });
    addScore(-betAmount);
    setIsSpinning(true);
    setLastWin(0);

    let cycles = 0;
    animTimerRef.current = setInterval(() => {
      cycles++;
      if (soundEnabled) playArcadeTone("spin");

      setGrid([
        [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
        [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
        [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
      ]);
      setActiveMultiplier(MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)]);

      if (cycles > 14) {
        clearInterval(animTimerRef.current);
        if (soundEnabled) playArcadeTone("stop");

        const finalGrid = [
          [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
          [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
          [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
        ];
        const finalMulti = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];

        setGrid(finalGrid);
        setActiveMultiplier(finalMulti);
        setIsSpinning(false);

        const c0 = finalGrid[0][1];
        const c1 = finalGrid[1][1];
        const c2 = finalGrid[2][1];

        const match =
          (c0 === c1 || c0 === "garuda" || c1 === "garuda") &&
          (c1 === c2 || c1 === "garuda" || c2 === "garuda");

        if (match) {
          const symId = [c0, c1, c2].find((x) => x !== "garuda") || "garuda";
          const sym = SYMBOLS.find((s) => s.id === symId) || SYMBOLS[0];
          const payout = Math.round(betAmount * (sym.pay / 2) * finalMulti);

          addScore(payout);
          setLastWin(payout);

          if (payout >= betAmount * 10) {
            if (soundEnabled) playArcadeTone("bigwin");
            setBigWinOverlay({ active: true, amount: payout, multi: finalMulti });
          } else {
            if (soundEnabled) playArcadeTone("win");
            toast.success(`🎉 WIN! +₹${payout} (${finalMulti}x Multiplier!)`);
          }
        }
      }
    }, 80);
  };

  return (
    <div className="relative mx-auto max-w-xl overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-b from-[#1a1208] via-[#0d0905] to-[#1a1208] p-4 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
      
      {/* Big Win Pop-Up Modal */}
      {bigWinOverlay.active && (
        <div 
          onClick={() => setBigWinOverlay({ active: false, amount: 0, multi: 1 })}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 text-center cursor-pointer animate-in zoom-in-95 duration-200"
        >
          <div className="relative flex flex-col items-center">
            <div className="w-20 h-20 mb-2">
              <GemGraphic id="garuda" />
            </div>
            <h1 className="font-display text-5xl font-black uppercase tracking-wider text-amber-300 drop-shadow-[0_0_30px_rgba(245,158,11,1)]">
              BIG WIN!
            </h1>
            <p className="mt-1 font-mono text-sm font-bold uppercase tracking-widest text-amber-400">
              {bigWinOverlay.multi}x Multiplier Boost
            </p>
            <div className="mt-4 rounded-2xl border-2 border-amber-400 bg-amber-500/20 px-8 py-3 shadow-[0_0_40px_rgba(245,158,11,0.5)]">
              <span className="font-display text-4xl font-black text-white">
                ₹{bigWinOverlay.amount.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-400">Tap anywhere to collect</p>
          </div>
        </div>
      )}

      {/* Header Deck */}
      <div className="mb-4 flex items-center justify-between border-b border-amber-600/30 pb-3">
        <div className="flex items-center gap-2">
          <Flame className="size-6 text-amber-400 animate-pulse" />
          <h2 className="font-display text-2xl font-black tracking-wider text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">
            FORTUNE GEMS 2
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-amber-300"
          >
            {soundEnabled ? <Volume2 className="size-4 text-amber-400" /> : <VolumeX className="size-4" />}
          </Button>
          <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            15x MULT REEL
          </span>
        </div>
      </div>

      {/* Realistic Aztec / Gold Slot Frame */}
      <div className="relative rounded-2xl border-4 border-[#b45309] bg-gradient-to-b from-[#1c1308] to-[#0a0602] p-3 shadow-2xl">
        
        {/* Golden Horizontal Winning Payline */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent pointer-events-none z-20 shadow-[0_0_15px_#f59e0b]" />

        <div className="grid grid-cols-4 gap-2">
          {/* 3 Main Slot Reels */}
          {[0, 1, 2].map((col) => (
            <div key={col} className="flex flex-col gap-2">
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className={`flex h-20 items-center justify-center rounded-xl border-2 bg-gradient-to-b from-[#2a1d0d] to-[#120c05] shadow-inner transition-all ${
                    row === 1
                      ? "border-amber-400/90 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-[1.02]"
                      : "border-amber-900/40 opacity-70"
                  } ${isSpinning ? "blur-[0.5px] scale-95" : ""}`}
                >
                  <GemGraphic id={grid[col][row]} />
                </div>
              ))}
            </div>
          ))}

          {/* 4th Special Aztec Multiplier Reel */}
          <div className="flex flex-col gap-2 rounded-xl border-2 border-purple-500/60 bg-gradient-to-b from-purple-950/40 to-slate-950 p-1">
            <div className="text-center text-[9px] font-black uppercase text-purple-300 tracking-wider">
              MULT REEL
            </div>
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-purple-400/40 bg-purple-900/30 shadow-inner">
              <span className="text-[9px] font-bold text-purple-300 uppercase">Center</span>
              <div
                className={`font-display text-3xl font-black text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] ${
                  isSpinning ? "animate-spin" : ""
                }`}
              >
                {activeMultiplier}x
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payline Win Alert */}
      {lastWin > 0 && !bigWinOverlay.active && (
        <div className="mt-3 rounded-xl border border-amber-500/50 bg-amber-500/20 p-2.5 text-center animate-bounce">
          <p className="text-[11px] uppercase font-bold text-amber-300">Winning Payline Hit!</p>
          <p className="font-display text-2xl font-black text-amber-200">
            + ₹{lastWin.toLocaleString("en-IN")}
          </p>
        </div>
      )}

      {/* Bet Options & Spin Action Deck */}
      <div className="mt-4 space-y-3 border-t border-amber-900/40 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-200/70">Bet Amount (₹)</span>
          <div className="flex items-center gap-1.5">
            {[5, 10, 25, 50, 100].map((amt) => (
              <Button
                key={amt}
                size="sm"
                type="button"
                variant={betAmount === amt ? "default" : "outline"}
                onClick={() => setBetAmount(amt)}
                className={`h-8 px-3 text-xs font-bold font-mono ${
                  betAmount === amt
                    ? "bg-amber-500 text-black font-black"
                    : "border-amber-700/50 text-amber-200"
                }`}
              >
                ₹{amt}
              </Button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSpin}
          disabled={isSpinning}
          className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 py-6 font-display text-base font-black tracking-widest uppercase text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.6)] active:scale-95 transition-all"
        >
          {isSpinning ? (
            <RefreshCw className="size-5 animate-spin" />
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Zap className="size-5 fill-slate-950" /> SPIN ₹{betAmount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

export default FortuneGemsGame;
      
