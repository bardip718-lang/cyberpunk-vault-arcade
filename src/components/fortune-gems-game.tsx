import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Trophy, Zap, RefreshCw, Flame } from "lucide-react";
import { toast } from "sonner";
import { useVault } from "@/lib/vault-store";

// Slot items with payouts
const SYMBOLS = [
  { id: "garuda", name: "WILD", label: "👑", pay: 20, color: "text-amber-400 border-amber-500/50 bg-amber-950/40" },
  { id: "red_gem", name: "RED GEM", label: "💎", pay: 10, color: "text-rose-400 border-rose-500/50 bg-rose-950/40" },
  { id: "blue_gem", name: "BLUE GEM", label: "🔷", pay: 6, color: "text-cyan-400 border-cyan-500/50 bg-cyan-950/40" },
  { id: "green_gem", name: "GREEN GEM", label: "🟢", pay: 4, color: "text-emerald-400 border-emerald-500/50 bg-emerald-950/40" },
  { id: "ten", name: "10", label: "10", pay: 2, color: "text-slate-300 border-slate-700 bg-slate-900/40" },
  { id: "jack", name: "J", label: "J", pay: 2, color: "text-slate-300 border-slate-700 bg-slate-900/40" },
];

const MULTIPLIERS = [1, 2, 3, 5, 10, 15];

export function FortuneGemsGame() {
  const { user, debitBalance, creditBalance } = useVault();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isSpinning, setIsSpinning] = useState(false);

  // 3x3 Grid + 4th Multiplier Reel
  const [grid, setGrid] = useState<string[][]>([
    ["garuda", "red_gem", "blue_gem"],
    ["red_gem", "garuda", "green_gem"],
    ["blue_gem", "green_gem", "ten"],
  ]);
  const [activeMultiplier, setActiveMultiplier] = useState<number>(1);
  const [lastWin, setLastWin] = useState<number>(0);
  const [showBigWin, setShowBigWin] = useState<boolean>(false);

  const handleSpin = () => {
    if (isSpinning) return;
    if (!user || user.balance < betAmount) {
      toast.error("Insufficient vault balance!");
      return;
    }

    debitBalance(betAmount);
    setIsSpinning(true);
    setShowBigWin(false);
    setLastWin(0);

    // Reel spin delay simulation
    setTimeout(() => {
      // Pick random 3x3 layout
      const newGrid: string[][] = [
        [pickSymbol(), pickSymbol(), pickSymbol()],
        [pickSymbol(), pickSymbol(), pickSymbol()],
        [pickSymbol(), pickSymbol(), pickSymbol()],
      ];

      // Pick 4th Reel Multiplier
      const multi = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];

      setGrid(newGrid);
      setActiveMultiplier(multi);
      setIsSpinning(false);

      // Check center line win (Reel row 1)
      const centerRow = [newGrid[0][1], newGrid[1][1], newGrid[2][1]];
      let isWin = false;
      let matchedSymbol = centerRow[0];

      // Wild match logic
      if (
        (centerRow[0] === centerRow[1] || centerRow[1] === "garuda" || centerRow[0] === "garuda") &&
        (centerRow[1] === centerRow[2] || centerRow[2] === "garuda" || centerRow[1] === "garuda")
      ) {
        isWin = true;
        matchedSymbol = centerRow.find((s) => s !== "garuda") || "garuda";
      }

      if (isWin) {
        const sym = SYMBOLS.find((s) => s.id === matchedSymbol) || SYMBOLS[0];
        const winPayout = Math.round(betAmount * (sym.pay / 2) * multi);
        creditBalance(winPayout);
        setLastWin(winPayout);

        if (winPayout >= betAmount * 10) {
          setShowBigWin(true);
          toast.success(`💥 MEGA WIN! ₹${winPayout} with ${multi}x Multiplier!`);
        } else {
          toast.success(`🎉 You Won ₹${winPayout}! (${multi}x applied)`);
        }
      }
    }, 1200);
  };

  function pickSymbol() {
    // Weighted selection for slot balance
    const rand = Math.random();
    if (rand < 0.08) return "garuda";
    if (rand < 0.20) return "red_gem";
    if (rand < 0.40) return "blue_gem";
    if (rand < 0.60) return "green_gem";
    if (rand < 0.80) return "ten";
    return "jack";
  }

  const getSymbolMeta = (id: string) => {
    return SYMBOLS.find((s) => s.id === id) || SYMBOLS[0];
  };

  return (
    <div className="neon-panel mx-auto max-w-2xl rounded-2xl border border-amber-500/40 p-4 sm:p-6 bg-gradient-to-b from-slate-950 via-background to-amber-950/20 shadow-2xl relative overflow-hidden">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-5">
        <div className="flex items-center gap-2">
          <Flame className="size-6 text-amber-400 animate-pulse" />
          <h2 className="font-display text-2xl font-black tracking-wider text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]">
            FORTUNE GEMS 2
          </h2>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
          SPECIAL MULTIPLIER REEL
        </span>
      </div>

      {/* Main Game Frame */}
      <div className="relative rounded-xl border-2 border-amber-500/50 bg-slate-950/90 p-4 shadow-inner">
        {/* Payline Indicator Overlay */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent pointer-events-none z-10 opacity-70" />

        <div className="grid grid-cols-4 gap-2">
          {/* 3 Main Reels */}
          {[0, 1, 2].map((colIndex) => (
            <div key={colIndex} className="flex flex-col gap-2">
              {[0, 1, 2].map((rowIndex) => {
                const sym = getSymbolMeta(grid[colIndex][rowIndex]);
                return (
                  <div
                    key={rowIndex}
                    className={`flex h-20 items-center justify-center rounded-xl border-2 font-display text-3xl font-black shadow-md transition-all duration-300 ${sym.color} ${
                      rowIndex === 1 ? "ring-1 ring-amber-400/80 scale-[1.02]" : "opacity-80"
                    } ${isSpinning ? "animate-pulse blur-[1px]" : ""}`}
                  >
                    {sym.label}
                  </div>
                );
              })}
            </div>
          ))}

          {/* 4th Multiplier Reel */}
          <div className="flex flex-col gap-2 rounded-xl border-2 border-purple-500/50 bg-purple-950/30 p-1.5">
            <div className="text-center text-[9px] font-black uppercase tracking-wider text-purple-300">
              MULT REEL
            </div>
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-purple-400/40 bg-purple-900/40 shadow-inner">
              <span className="text-[10px] text-purple-300 font-bold uppercase">Center</span>
              <div
                className={`font-display text-3xl font-black text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] ${
                  isSpinning ? "animate-bounce" : ""
                }`}
              >
                {activeMultiplier}x
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Win Banner Display */}
      {lastWin > 0 && (
        <div className="mt-4 rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-center animate-pulse">
          <p className="text-xs uppercase font-bold text-amber-400 tracking-wider">Winning Payline Hit!</p>
          <p className="font-display text-2xl font-black text-amber-300">
            + ₹{lastWin.toLocaleString("en-IN")}
          </p>
        </div>
      )}

      {/* Control Deck */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400">Bet Amount (₹)</span>
          <div className="flex items-center gap-1.5">
            {[5, 10, 25, 50, 100].map((amt) => (
              <Button
                key={amt}
                size="sm"
                variant={betAmount === amt ? "default" : "outline"}
                onClick={() => setBetAmount(amt)}
                className="h-8 text-xs font-bold font-mono"
              >
                ₹{amt}
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={handleSpin}
          disabled={isSpinning}
          className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 px-8 py-6 font-display text-base font-black tracking-widest uppercase text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:scale-105 transition-all"
        >
          {isSpinning ? (
            <RefreshCw className="size-5 animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              <Zap className="size-5 fill-slate-950" /> SPIN ₹{betAmount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

export default FortuneGemsGame;
    
