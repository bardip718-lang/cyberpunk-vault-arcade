import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Zap, RefreshCw, Flame } from "lucide-react";
import { toast } from "sonner";
import { useVault } from "@/lib/vault-store";

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
  const { user, addScore } = useVault();

  const [betAmount, setBetAmount] = useState<number>(5);
  const [isSpinning, setIsSpinning] = useState(false);

  // 3x3 Grid
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

    // Direct deduction from store balance
    addScore(-betAmount);

    setIsSpinning(true);
    setLastWin(0);

    // Fast slot rolling effect
    let cycles = 0;
    animTimerRef.current = setInterval(() => {
      cycles++;
      setGrid([
        [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
        [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
        [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
      ]);
      setActiveMultiplier(MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)]);

      if (cycles > 12) {
        clearInterval(animTimerRef.current);

        const finalGrid = [
          [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
          [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
          [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()],
        ];
        const finalMulti = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];

        setGrid(finalGrid);
        setActiveMultiplier(finalMulti);
        setIsSpinning(false);

        // Center line win check (row 1)
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

          // Direct credit to store balance
          addScore(payout);
          setLastWin(payout);
          toast.success(`🎉 WIN! +₹${payout} (${finalMulti}x Multiplier applied!)`);
        }
      }
    }, 90);
  };

  const getMeta = (id: string) => SYMBOLS.find((s) => s.id === id) || SYMBOLS[0];

  return (
    <div className="neon-panel mx-auto max-w-2xl rounded-2xl border border-amber-500/40 p-4 sm:p-6 bg-gradient-to-b from-slate-950 via-background to-amber-950/20 shadow-2xl">
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Flame className="size-6 text-amber-400 animate-pulse" />
          <h2 className="font-display text-xl font-black tracking-wider text-amber-300">
            FORTUNE GEMS 2
          </h2>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
          SPECIAL MULTIPLIER REEL
        </span>
      </div>

      <div className="relative rounded-xl border-2 border-amber-500/50 bg-slate-950/90 p-3 shadow-inner">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-amber-500/20 via-amber-400 to-amber-500/20 pointer-events-none z-10" />

        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2].map((col) => (
            <div key={col} className="flex flex-col gap-2">
              {[0, 1, 2].map((row) => {
                const item = getMeta(grid[col][row]);
                return (
                  <div
                    key={row}
                    className={`flex h-16 sm:h-20 items-center justify-center rounded-xl border-2 font-display text-2xl sm:text-3xl font-black shadow-md transition-all ${
                      item.color
                    } ${row === 1 ? "ring-2 ring-amber-400/90 scale-[1.02]" : "opacity-75"} ${
                      isSpinning ? "blur-[0.5px] scale-95" : ""
                    }`}
                  >
                    {item.label}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="flex flex-col gap-2 rounded-xl border-2 border-purple-500/50 bg-purple-950/30 p-1">
            <div className="text-center text-[9px] font-black uppercase text-purple-300">
              MULT REEL
            </div>
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-purple-400/40 bg-purple-900/40">
              <span className="text-[9px] text-purple-300 font-bold uppercase">Center</span>
              <div
                className={`font-display text-2xl sm:text-3xl font-black text-amber-300 ${
                  isSpinning ? "animate-spin" : ""
                }`}
              >
                {activeMultiplier}x
              </div>
            </div>
          </div>
        </div>
      </div>

      {lastWin > 0 && (
        <div className="mt-3 rounded-xl border border-amber-500/50 bg-amber-500/20 p-2.5 text-center animate-bounce">
          <p className="text-[11px] uppercase font-bold text-amber-300">Winning Payline Hit!</p>
          <p className="font-display text-xl font-black text-amber-200">
            + ₹{lastWin.toLocaleString("en-IN")}
          </p>
        </div>
      )}

      <div className="mt-4 space-y-3 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Bet Amount (₹)</span>
          <div className="flex items-center gap-1">
            {[5, 10, 25, 50, 100].map((amt) => (
              <Button
                key={amt}
                size="sm"
                type="button"
                variant={betAmount === amt ? "default" : "outline"}
                onClick={() => setBetAmount(amt)}
                className="h-7 px-2.5 text-xs font-bold font-mono"
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
          className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 py-6 font-display text-base font-black tracking-widest uppercase text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-95 transition-all"
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
    
