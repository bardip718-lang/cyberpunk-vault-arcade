import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useVault } from "@/lib/vault-store";
import { Disc, Trophy, RotateCcw } from "lucide-react";

const ROULETTE_NUMS = [
  { num: 0, color: "green" }, { num: 32, color: "red" }, { num: 15, color: "black" },
  { num: 19, color: "red" }, { num: 4, color: "black" }, { num: 21, color: "red" },
  { num: 2, color: "black" }, { num: 25, color: "red" }, { num: 17, color: "black" },
  { num: 34, color: "red" }, { num: 6, color: "black" }, { num: 27, color: "red" },
  { num: 13, color: "black" }, { num: 36, color: "red" }, { num: 11, color: "black" },
  { num: 30, color: "red" }, { num: 8, color: "black" }, { num: 23, color: "red" },
  { num: 10, color: "black" }, { num: 5, color: "red" }, { num: 24, color: "black" }
];

export function RouletteGame() {
  const { user, updateBalance } = useVault();
  const [betAmount, setBetAmount] = useState<number>(20);
  const [selectedBet, setSelectedBet] = useState<string>("red");
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<{ num: number; color: string } | null>(null);
  const [winMsg, setWinMsg] = useState<string | null>(null);
  const [rot, setRot] = useState(0);

  const handleSpin = () => {
    if ((user?.balance || 0) < betAmount) {
      alert("Insufficient balance! Please deposit.");
      return;
    }
    if (typeof updateBalance === "function") {
      updateBalance(-betAmount);
    }

    setSpinning(true);
    setWinMsg(null);
    const idx = Math.floor(Math.random() * ROULETTE_NUMS.length);
    setRot((prev) => prev + 1800 + idx * (360 / ROULETTE_NUMS.length));

    setTimeout(() => {
      const out = ROULETTE_NUMS[idx];
      setLastResult(out);
      setSpinning(false);
      let won = false;
      let mult = 2;
      if (selectedBet === out.color) {
        won = true;
        if (out.color === "green") mult = 14;
      }
      if (won) {
        const amt = betAmount * mult;
        if (typeof updateBalance === "function") updateBalance(amt);
        setWinMsg(`Won +₹${amt}! (${mult}x payout)`);
      } else {
        setWinMsg(`Landed on ${out.num} ${out.color.toUpperCase()}`);
      }
    }, 3000);
  };

  return (
    <div className="neon-panel rounded-xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl neon-text flex items-center gap-2">
            <Disc className="size-6 text-primary" /> Neon Roulette Wheel
          </h2>
          <p className="text-xs text-muted-foreground">Pick color &amp; win up to 14x rewards.</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center my-6">
        <div className="relative flex items-center justify-center size-52 rounded-full border-4 border-primary/40 bg-background/90 shadow-xl overflow-hidden">
          <div
            className="w-full h-full rounded-full transition-transform duration-[3000ms] ease-out flex items-center justify-center border border-dashed border-primary/30"
            style={{ transform: `rotate(${rot}deg)` }}
          />
          <div className="absolute z-10 flex flex-col items-center justify-center size-20 rounded-full border border-border bg-secondary/90 shadow-md">
            {lastResult ? (
              <span className={`text-xl font-bold font-display ${lastResult.color === "red" ? "text-rose-400" : lastResult.color === "black" ? "text-slate-300" : "text-emerald-400"}`}>
                {lastResult.num}
              </span>
            ) : (
              <span className="text-xs font-display text-muted-foreground">SPIN</span>
            )}
          </div>
        </div>
        {winMsg && (
          <div className="mt-3 text-sm font-display font-bold text-primary flex items-center gap-1 animate-bounce">
            <Trophy className="size-4" /> {winMsg}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">1. Choose Color</div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={selectedBet === "red" ? "default" : "secondary"}
            onClick={() => setSelectedBet("red")}
            className="font-display font-bold text-rose-300"
          >
            RED (2x)
          </Button>
          <Button
            type="button"
            variant={selectedBet === "black" ? "default" : "secondary"}
            onClick={() => setSelectedBet("black")}
            className="font-display font-bold text-slate-300"
          >
            BLACK (2x)
          </Button>
          <Button
            type="button"
            variant={selectedBet === "green" ? "default" : "secondary"}
            onClick={() => setSelectedBet("green")}
            className="font-display font-bold text-emerald-300"
          >
            GREEN (14x)
          </Button>
        </div>

        <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">2. Bet Amount</div>
        <div className="flex flex-wrap gap-2">
          {[10, 20, 50, 100, 500].map((a) => (
            <Button
              key={a}
              size="sm"
              variant={betAmount === a ? "default" : "outline"}
              onClick={() => setBetAmount(a)}
              className="font-display"
            >
              ₹{a}
            </Button>
          ))}
        </div>

        <Button
          onClick={handleSpin}
          disabled={spinning}
          className="w-full py-5 text-base font-display font-bold tracking-widest uppercase mt-2"
        >
          {spinning ? (
            <span className="flex items-center gap-2">
              <RotateCcw className="size-5 animate-spin" /> Wheel Spinning...
            </span>
          ) : (
            `Spin for ₹${betAmount}`
          )}
        </Button>
      </div>
    </div>
  );
}                 }

