import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useVault } from "@/lib/vault-store";
import { Disc, Sparkles, Trophy, RotateCcw } from "lucide-react";

const ROULETTE_NUMBERS = [
  { num: 0, color: "green" },
  { num: 32, color: "red" },
  { num: 15, color: "black" },
  { num: 19, color: "red" },
  { num: 4, color: "black" },
  { num: 21, color: "red" },
  { num: 2, color: "black" },
  { num: 25, color: "red" },
  { num: 17, color: "black" },
  { num: 34, color: "red" },
  { num: 6, color: "black" },
  { num: 27, color: "red" },
  { num: 13, color: "black" },
  { num: 36, color: "red" },
  { num: 11, color: "black" },
  { num: 30, color: "red" },
  { num: 8, color: "black" },
  { num: 23, color: "red" },
  { num: 10, color: "black" },
  { num: 5, color: "red" },
  { num: 24, color: "black" },
  { num: 16, color: "red" },
  { num: 33, color: "black" },
  { num: 1, color: "red" },
  { num: 20, color: "black" },
  { num: 14, color: "red" },
  { num: 31, color: "black" },
  { num: 9, color: "red" },
  { num: 22, color: "black" },
  { num: 18, color: "red" },
  { num: 29, color: "black" },
  { num: 7, color: "red" },
  { num: 28, color: "black" },
  { num: 12, color: "red" },
  { num: 35, color: "black" },
  { num: 3, color: "red" },
  { num: 26, color: "black" },
];

export function RouletteGame() {
  const { user, updateBalance } = useVault();
  const [betAmount, setBetAmount] = useState<number>(20);
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<{ num: number; color: string } | null>(null);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const handleSpin = () => {
    if (!selectedBet) {
      alert("Please select a bet (Red, Black, Green, Even, or Odd) first!");
      return;
    }
    const currentBalance = user?.balance || 0;
    if (currentBalance < betAmount) {
      alert("Insufficient score balance. Please top up!");
      return;
    }

    // Deduct bet
    if (typeof updateBalance === "function") {
      updateBalance(-betAmount);
    }

    setSpinning(true);
    setWinMessage(null);

    // Random spin angle (min 5 full rotations + random slice)
    const randomIndex = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
    const degreesPerSlice = 360 / ROULETTE_NUMBERS.length;
    const targetDegree = 360 * 5 + randomIndex * degreesPerSlice;
    setRotation((prev) => prev + targetDegree);

    setTimeout(() => {
      const outcome = ROULETTE_NUMBERS[randomIndex];
      setLastResult(outcome);
      setSpinning(false);

      let won = false;
      let multiplier = 0;

      if (selectedBet === "red" && outcome.color === "red") {
        won = true;
        multiplier = 2;
      } else if (selectedBet === "black" && outcome.color === "black") {
        won = true;
        multiplier = 2;
      } else if (selectedBet === "green" && outcome.color === "green") {
        won = true;
        multiplier = 14;
      } else if (selectedBet === "even" && outcome.num !== 0 && outcome.num % 2 === 0) {
        won = true;
        multiplier = 2;
      } else if (selectedBet === "odd" && outcome.num % 2 !== 0) {
        won = true;
        multiplier = 2;
      }

      if (won) {
        const winAmount = betAmount * multiplier;
        if (typeof updateBalance === "function") {
          updateBalance(winAmount);
        }
        setWinMessage(`Won +₹${winAmount}! (${multiplier}x payout)`);
      } else {
        setWinMessage(`Landed on ${outcome.num} (${outcome.color.toUpperCase()}). Better luck next round!`);
      }
    }, 3500);
  };

  return (
    <div className="neon-panel rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl neon-text flex items-center gap-2">
            <Disc className="size-6 text-primary" /> Neon Roulette Wheel
          </h2>
          <p className="text-xs text-muted-foreground">Pick a color/condition, spin and claim up to 14x multipliers.</p>
        </div>
      </div>

      {/* Wheel Visual */}
      <div className="flex flex-col items-center justify-center my-6">
        <div className="relative flex items-center justify-center size-56 sm:size-64 rounded-full border-4 border-primary/40 bg-background/90 shadow-[0_0_30px_rgba(0,255,200,0.15)] overflow-hidden">
          {/* Center Indicator */}
          <div
            className="w-full h-full rounded-full transition-transform duration-[3500ms] ease-out flex items-center justify-center"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div className="absolute inset-2 rounded-full border border-dashed border-primary/30 flex items-center justify-center">
              <Sparkles className="size-10 text-primary/40" />
            </div>
          </div>

          <div className="absolute z-10 flex flex-col items-center justify-center size-24 rounded-full border border-border bg-secondary/90 shadow-lg text-center">
            {lastResult ? (
              <>
                <span
                  className={`text-2xl font-bold font-display ${
                    lastResult.color === "red"
                      ? "text-rose-400"
                      : lastResult.color === "black"
                      ? "text-slate-300"
                      : "text-emerald-400"
                  }`}
                >
                  {lastResult.num}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {lastResult.color}
                </span>
              </>
            ) : (
              <span className="text-xs font-display text-muted-foreground">SPIN</span>
            )}
          </div>
        </div>

        {winMessage && (
          <div className="mt-4 flex items-center gap-2 text-sm font-display font-semibold text-primary animate-bounce">
            <Trophy className="size-4" /> {winMessage}
          </div>
        )}
      </div>

      {/* Bet Selection */}
      <div className="space-y-4">
        <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">1. Choose Bet Type</div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <Button
            type="button"
            variant={selectedBet === "red" ? "default" : "secondary"}
            onClick={() => setSelectedBet("red")}
            className="border-rose-500/50 hover:bg-rose-500/20 text-rose-300 font-display font-bold"
          >
            RED (2x)
          </Button>
          <Button
            type="button"
            variant={selectedBet === "black" ? "default" : "secondary"}
            onClick={() => setSelectedBet("black")}
            className="border-slate-500/50 hover:bg-slate-500/20 text-slate-300 font-display font-bold"
          >
            BLACK (2x)
          </Button>
          <Button
            type="button"
            variant={selectedBet === "green" ? "default" : "secondary"}
            onClick={() => setSelectedBet("green")}
            className="border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-300 font-display font-bold"
          >
            GREEN (14x)
          </Button>
          <Button
            type="button"
            variant={selectedBet === "even" ? "default" : "secondary"}
            onClick={() => setSelectedBet("even")}
            className="font-display font-bold"
          >
            EVEN (2x)
          </Button>
          <Button
            type="button"
            variant={selectedBet === "odd" ? "default" : "secondary"}
            onClick={() => setSelectedBet("odd")}
            className="font-display font-bold"
          >
            ODD (2x)
          </Button>
        </div>

        {/* Bet Value Controls */}
        <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground pt-2">2. Bet Amount</div>
        <div className="flex flex-wrap items-center gap-2">
          {[10, 20, 50, 100, 500].map((amt) => (
            <Button
              key={amt}
              size="sm"
              variant={betAmount === amt ? "default" : "outline"}
              onClick={() => setBetAmount(amt)}
              className="font-display"
            >
              ₹{amt}
            </Button>
          ))}
        </div>

        {/* Action Button */}
        <Button
          onClick={handleSpin}
          disabled={spinning}
          className="w-full mt-4 py-6 text-lg font-display tracking-widest uppercase font-bold"
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
    }
            
