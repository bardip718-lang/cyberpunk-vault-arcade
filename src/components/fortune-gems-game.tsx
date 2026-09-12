import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Zap, RefreshCw, Flame, Volume2, VolumeX, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useVault } from "@/lib/vault-store";

// Sound synthesizer for clicks, spins and wins
const playArcadeTone = (type: "spin" | "stop" | "win" | "bigwin" | "wheel") => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "spin") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.05);
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
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
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
    } else if (type === "bigwin" || type === "wheel") {
      [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.14, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.28);
      });
    }
  } catch {
    // Audio handle
  }
};

// 3D Gemstone Graphics matching Fortune Gems 2
function GemGraphic({ id }: { id: string }) {
  if (id === "garuda") {
    return (
      <div className="relative flex flex-col items-center justify-center">
        <svg viewBox="0 0 100 100" className="size-11 drop-shadow-[0_0_12px_rgba(245,158,11,0.9)]">
          <defs>
            <linearGradient id="goldMask" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
          </defs>
          <path d="M50 5 L85 25 L85 75 L50 95 L15 75 L15 25 Z" fill="url(#goldMask)" stroke="#fef08a" strokeWidth="2.5" />
          <circle cx="35" cy="40" r="6" fill="#dc2626" stroke="#fff" strokeWidth="1" />
          <circle cx="65" cy="40" r="6" fill="#dc2626" stroke="#fff" strokeWidth="1" />
          <path d="M40 65 Q50 78 60 65" stroke="#78350f" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
        <span className="text-[8.5px] font-black tracking-widest text-yellow-300 uppercase leading-none mt-1">WILD</span>
      </div>
    );
  }

  if (id === "red_gem") {
    return (
      <div className="relative flex flex-col items-center justify-center">
        <svg viewBox="0 0 100 100" className="size-10 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]">
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
        <span className="text-[8px] font-black tracking-widest text-rose-300 uppercase leading-none mt-1">RUBY</span>
      </div>
    );
  }

  if (id === "blue_gem") {
    return (
      <div className="relative flex flex-col items-center justify-center">
        <svg viewBox="0 0 100 100" className="size-10 drop-shadow-[0_0_12px_rgba(59,130,246,0.9)]">
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
        <span className="text-[8px] font-black tracking-widest text-blue-300 uppercase leading-none mt-1">SAPPHIRE</span>
      </div>
    );
  }

  if (id === "green_gem") {
    return (
      <div className="relative flex flex-col items-center justify-center">
        <svg viewBox="0 0 100 100" className="size-10 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]">
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
        <span className="text-[8px] font-black tracking-widest text-emerald-300 uppercase leading-none mt-1">EMERALD</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <span className="font-sans text-2xl font-black text-amber-200/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        {id.toUpperCase()}
      </span>
    </div>
  );
}

// Multiplier Badge Render
function MultiplierTile({ value }: { value: string | number }) {
  if (value === "WHEEL") {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="size-8 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-yellow-300 flex items-center justify-center shadow-[0_0_10px_#f59e0b] animate-spin">
          <Sparkles className="size-4 text-white" />
        </div>
        <span className="text-[8px] font-black text-yellow-300 mt-0.5">WHEEL</span>
      </div>
    );
  }

  const num = Number(value);
  const color = 
    num >= 10 ? "text-rose-400 border-rose-500/50 bg-rose-950/40" :
    num >= 5 ? "text-amber-300 border-amber-500/50 bg-amber-950/40" :
    "text-blue-300 border-blue-500/50 bg-blue-950/40";

  return (
    <div className={`px-2 py-1 rounded-lg border font-sans text-base font-black tracking-tight ${color} shadow-sm`}>
      {num}x
    </div>
  );
}

const SYMBOLS = [
  { id: "garuda", pay: 25 },
  { id: "red_gem", pay: 12 },
  { id: "blue_gem", pay: 8 },
  { id: "green_gem", pay: 5 },
  { id: "A", pay: 2 },
  { id: "K", pay: 2 },
  { id: "Q", pay: 1.5 },
  { id: "J", pay: 1.5 },
];

export function FortuneGemsGame() {
  const { user, addScore } = useVault();

  const [baseBet, setBaseBet] = useState<number>(10);
  const [extraBetMode, setExtraBetMode] = useState<boolean>(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Lucky Wheel Modal State
  const [wheelActive, setWheelActive] = useState(false);
  const [wheelPrize, setWheelPrize] = useState<number | null>(null);

  // Big Win Overlay State
  const [bigWinOverlay, setBigWinOverlay] = useState<{ active: boolean; amount: number; multi: number }>({
    active: false,
    amount: 0,
    multi: 1,
  });

  const [grid, setGrid] = useState<string[][]>([
    ["garuda", "red_gem", "blue_gem"],
    ["red_gem", "garuda", "green_gem"],
    ["blue_gem", "green_gem", "A"],
  ]);

  // 4th Special Reel (3 vertical slots)
  const [specialReel, setSpecialReel] = useState<(number | string)[]>([2, 5, 1]);
  const [lastWin, setLastWin] = useState<number>(0);
  const animTimerRef = useRef<any>(null);

  // Total Bet calculation: Extra Bet adds +50%
  const totalBet = extraBetMode ? Math.round(baseBet * 1.5) : baseBet;

  const getMultiplierPool = () => {
    // In Extra Bet mode, 1x is removed permanently
    if (extraBetMode) {
      return [2, 3, 5, 10, 15, "WHEEL"];
    }
    return [1, 2, 3, 5, 10, 15, "WHEEL"];
  };

  const pickRandomSymbol = () => {
    const rand = Math.random();
    if (rand < 0.08) return "garuda";
    if (rand < 0.22) return "red_gem";
    if (rand < 0.40) return "blue_gem";
    if (rand < 0.58) return "green_gem";
    if (rand < 0.72) return "A";
    if (rand < 0.84) return "K";
    if (rand < 0.92) return "Q";
    return "J";
  };

  const handleSpin = () => {
    if (isSpinning) return;

    if (!user || user.balance < totalBet) {
      toast.error("Insufficient balance! Please deposit.");
      return;
    }

    setBigWinOverlay({ active: false, amount: 0, multi: 1 });
    addScore(-totalBet);
    setIsSpinning(true);
    setLastWin(0);

    const pool = getMultiplierPool();
    let cycles = 0;

    animTimerRef.current = setInterval(() => {
      cycles++;
      if (soundEnabled) playArcadeTone("spin");

      setGrid([
        [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
        [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
        [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
      ]);

      setSpecialReel([
        pool[Math.floor(Math.random() * pool.length)]!,
        pool[Math.floor(Math.random() * pool.length)]!,
        pool[Math.floor(Math.random() * pool.length)]!,
      ]);

      if (cycles > 16) {
        clearInterval(animTimerRef.current);
        if (soundEnabled) playArcadeTone("stop");

        const finalGrid = [
          [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
          [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
          [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
        ];

        const finalSpecialReel = [
          pool[Math.floor(Math.random() * pool.length)]!,
          pool[Math.floor(Math.random() * pool.length)]!,
          pool[Math.floor(Math.random() * pool.length)]!,
        ];

        setGrid(finalGrid);
        setSpecialReel(finalSpecialReel);
        setIsSpinning(false);

        // Center line evaluate
        const centerMulti = finalSpecialReel[1];
        const c0 = finalGrid[0]![1];
        const c1 = finalGrid[1]![1];
        const c2 = finalGrid[2]![1];

        // Check if Lucky Wheel landed on center line
        if (centerMulti === "WHEEL") {
          triggerLuckyWheel();
          return;
        }

        const match =
          (c0 === c1 || c0 === "garuda" || c1 === "garuda") &&
          (c1 === c2 || c1 === "garuda" || c2 === "garuda");

        if (match) {
          const symId = [c0, c1, c2].find((x) => x !== "garuda") || "garuda";
          const sym = SYMBOLS.find((s) => s.id === symId) || SYMBOLS[0]!;
          const multiNum = typeof centerMulti === "number" ? centerMulti : 1;
          const payout = Math.round(baseBet * (sym.pay / 2) * multiNum);

          addScore(payout);
          setLastWin(payout);

          if (payout >= totalBet * 8) {
            if (soundEnabled) playArcadeTone("bigwin");
            setBigWinOverlay({ active: true, amount: payout, multi: multiNum });
          } else {
            if (soundEnabled) playArcadeTone("win");
            toast.success(`🎉 WIN! +₹${payout} (${multiNum}x Multiplier!)`);
          }
        }
      }
    }, 75);
  };

  const triggerLuckyWheel = () => {
    if (soundEnabled) playArcadeTone("wheel");
    const WHEEL_PRIZES = [50, 80, 100, 150, 200, 300];
    const prizeMulti = WHEEL_PRIZES[Math.floor(Math.random() * WHEEL_PRIZES.length)]!;
    const wonAmount = baseBet * prizeMulti;

    setWheelPrize(wonAmount);
    setWheelActive(true);

    setTimeout(() => {
      addScore(wonAmount);
      setLastWin(wonAmount);
      toast.success(`🎡 LUCKY WHEEL BONUS! Won ₹${wonAmount}`);
    }, 2200);
  };

  return (
    <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-amber-600/40 bg-gradient-to-b from-[#1b1206] via-[#0c0803] to-[#140e05] p-3 shadow-2xl font-sans select-none">
      
      {/* Lucky Wheel Modal */}
      {wheelActive && (
        <div 
          onClick={() => setWheelActive(false)}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md p-6 text-center cursor-pointer animate-in zoom-in-95 duration-200"
        >
          <div className="size-44 rounded-full border-4 border-amber-400 bg-gradient-to-tr from-yellow-600 via-amber-500 to-yellow-300 flex items-center justify-center shadow-[0_0_50px_#f59e0b] animate-spin">
            <span className="text-xl font-black text-slate-950 font-display">LUCKY WHEEL</span>
          </div>
          <h2 className="text-2xl font-black text-amber-300 uppercase mt-4">WHEEL BONUS!</h2>
          <div className="mt-3 rounded-2xl border border-amber-400 bg-amber-500/20 px-6 py-2">
            <span className="text-3xl font-black text-white">₹{wheelPrize?.toLocaleString("en-IN")}</span>
          </div>
          <p className="mt-3 text-xs text-slate-400">Tap anywhere to collect</p>
        </div>
      )}

      {/* Big Win Pop-Up Modal */}
      {bigWinOverlay.active && (
        <div 
          onClick={() => setBigWinOverlay({ active: false, amount: 0, multi: 1 })}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 text-center cursor-pointer animate-in zoom-in-95 duration-200"
        >
          <div className="size-16 mb-2">
            <GemGraphic id="garuda" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-wider text-amber-300 drop-shadow-[0_0_25px_rgba(245,158,11,1)]">
            BIG WIN!
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mt-1">
            {bigWinOverlay.multi}x Multiplier Boost
          </p>
          <div className="mt-3 rounded-xl border border-amber-400 bg-amber-500/20 px-6 py-2 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
            <span className="text-3xl font-black text-white">
              ₹{bigWinOverlay.amount.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-400">Tap to collect</p>
        </div>
      )}

      {/* Header Deck with Extra Bet (EX) Toggle */}
      <div className="mb-3 flex items-center justify-between border-b border-amber-900/40 pb-2">
        <div>
          <h2 className="text-lg font-black tracking-tight text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]">
            FORTUNE GEMS 2
          </h2>
          <p className="text-[9px] text-amber-500/80 font-bold">JILI GAMES • 3x3 + SPECIAL REEL</p>
        </div>

        {/* 1win Style EX Extra Bet Toggle (+50%) */}
        <button
          onClick={() => setExtraBetMode(!extraBetMode)}
          disabled={isSpinning}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-black transition-all ${
            extraBetMode
              ? "bg-gradient-to-r from-amber-500 to-yellow-600 border-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.6)]"
              : "bg-[#181109] border-amber-900/60 text-amber-400 hover:border-amber-700"
          }`}
        >
          <span className="text-[10px] px-1 bg-amber-400 text-slate-950 rounded font-black">EX</span>
          <span>{extraBetMode ? "ON (+50%)" : "OFF"}</span>
        </button>
      </div>

      {/* Aztec / Gold Slot Frame */}
      <div className="relative rounded-2xl border-2 border-amber-600/60 bg-[#0f0a04] p-2.5 shadow-2xl">
        
        {/* Horizontal Center Winning Payline */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent pointer-events-none z-20 shadow-[0_0_12px_#f59e0b]" />

        <div className="grid grid-cols-4 gap-1.5">
          
          {/* 3 Regular Slot Reels */}
          {[0, 1, 2].map((col) => (
            <div key={col} className="flex flex-col gap-1.5">
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className={`flex h-16 sm:h-20 items-center justify-center rounded-xl border bg-gradient-to-b from-[#241708] to-[#120b04] transition-all ${
                    row === 1
                      ? "border-amber-400/90 shadow-[0_0_12px_rgba(245,158,11,0.35)] scale-[1.01]"
                      : "border-amber-950/60 opacity-60"
                  } ${isSpinning ? "blur-[0.5px]" : ""}`}
                >
                  <GemGraphic id={grid[col][row]} />
                </div>
              ))}
            </div>
          ))}

          {/* 4th Special Multiplier Reel (3 Rows with Center Framed) */}
          <div className="flex flex-col gap-1.5 rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-950/30 to-purple-950/40 p-0.5">
            <div className="text-center text-[8px] font-black uppercase text-amber-300 py-0.5">
              SPECIAL REEL
            </div>
            {[0, 1, 2].map((row) => (
              <div
                key={row}
                className={`flex h-14 sm:h-[4.7rem] items-center justify-center rounded-lg border transition-all ${
                  row === 1
                    ? "border-amber-400 bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-[1.03]"
                    : "border-slate-800/80 bg-[#0c0803] opacity-50"
                }`}
              >
                <MultiplierTile value={specialReel[row]} />
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Payline Win Alert */}
      {lastWin > 0 && !bigWinOverlay.active && (
        <div className="mt-2.5 rounded-xl border border-amber-500/50 bg-amber-500/20 p-2 text-center animate-bounce">
          <p className="text-[10px] uppercase font-bold text-amber-300">Center Payline Hit!</p>
          <p className="text-xl font-black text-amber-200">
            + ₹{lastWin.toLocaleString("en-IN")}
          </p>
        </div>
      )}

      {/* Bet Options & Spin Control */}
      <div className="mt-3 space-y-2 border-t border-amber-900/40 pt-2.5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold">TOTAL BET</span>
            <span className="text-sm font-black text-emerald-400">₹{totalBet}</span>
          </div>

          <div className="flex items-center gap-1">
            {[10, 25, 50, 100].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setBaseBet(amt)}
                className={`h-7 px-2.5 rounded-lg text-[11px] font-bold border transition-all ${
                  baseBet === amt
                    ? "bg-amber-500 border-amber-400 text-slate-950 font-black"
                    : "border-amber-900/60 bg-[#140e05] text-amber-200"
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          onClick={handleSpin}
          disabled={isSpinning}
          className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 py-5 text-sm font-black tracking-widest uppercase text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-95 transition-all rounded-xl"
        >
          {isSpinning ? (
            <RefreshCw className="size-5 animate-spin text-slate-950" />
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Zap className="size-4 fill-slate-950" /> SPIN ₹{totalBet}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

export default FortuneGemsGame;
