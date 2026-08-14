import { useCallback, useEffect, useRef, useState } from "react";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault } from "@/lib/vault-store";
import { sfx } from "@/lib/sfx";
import { toast } from "sonner";

type Phase = "idle" | "flying" | "crashed" | "cashed";

export function AviatorGame() {
  const { user, addScore } = useVault();
  const [bet, setBet] = useState("50");
  const [mult, setMult] = useState(1);
  const [phase, setPhase] = useState<Phase>("idle");
  const [history, setHistory] = useState<number[]>([]);
  const [payout, setPayout] = useState(0);
  const crashAt = useRef(1);
  const raf = useRef<number | null>(null);
  const staked = useRef(0);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  const stop = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);

  function launch() {
    const amt = Number(bet);
    if (!user) { toast.error("Sign in or enter guest mode to play"); return; }
    if (!Number.isFinite(amt) || amt < 10) { toast.error("Minimum bet is 10 credits"); return; }
    if (amt > user.balance) { toast.error("Not enough credits — top up the vault"); return; }

    staked.current = Math.round(amt);
    addScore(-staked.current);
    setPayout(0);
    setMult(1);
    setPhase("flying");
    sfx.spin();
    // House edge ~4%; heavy tail crash curve.
    crashAt.current = Math.max(1, Number((0.96 / (1 - Math.random())).toFixed(2)));

    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const m = Number(Math.pow(1.07, t * 6).toFixed(2));
      if (m >= crashAt.current) {
        setMult(crashAt.current);
        setPhase("crashed");
        setHistory((h) => [crashAt.current, ...h].slice(0, 8));
        sfx.lose();
        stop();
        return;
      }
      setMult(m);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }

  function cashOut() {
    if (phase !== "flying") return;
    stop();
    const win = Math.round(staked.current * mult);
    addScore(win);
    setPayout(win);
    setPhase("cashed");
    setHistory((h) => [mult, ...h].slice(0, 8));
    sfx.win();
  }

  return (
    <section className="space-y-6">
      <div className="neon-panel rounded-xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl neon-text">Aviator</h2>
          <div className="flex gap-1.5">
            {history.map((h, i) => (
              <span
                key={i}
                className={`rounded px-2 py-0.5 text-xs font-display ${h >= 2 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}
              >
                {h.toFixed(2)}×
              </span>
            ))}
          </div>
        </div>

        <div className="relative mt-4 h-56 overflow-hidden rounded-lg border border-border bg-background/70">
          <div
            className="absolute transition-none"
            style={{
              left: `${Math.min(82, (mult - 1) * 22)}%`,
              bottom: `${Math.min(78, (mult - 1) * 20)}%`,
            }}
          >
            <Plane
              className={`size-8 ${phase === "crashed" ? "text-destructive" : "text-primary"}`}
              style={{ transform: "rotate(-25deg)" }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <p
              className={`font-display text-5xl ${
                phase === "crashed" ? "text-destructive" : phase === "cashed" ? "text-success" : "neon-text"
              }`}
            >
              {mult.toFixed(2)}×
            </p>
          </div>
          <p className="absolute inset-x-0 bottom-3 text-center text-sm text-muted-foreground">
            {phase === "crashed"
              ? "Flew away — bet lost."
              : phase === "cashed"
                ? `Cashed out +${payout} credits`
                : phase === "flying"
                  ? "Cash out before it flies away!"
                  : "Place your bet and take off."}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="av-bet">Bet (credits)</Label>
            <Input
              id="av-bet"
              className="w-32"
              inputMode="numeric"
              value={bet}
              disabled={phase === "flying"}
              onChange={(e) => setBet(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          {phase === "flying" ? (
            <Button onClick={cashOut} className="font-display tracking-wide">
              Cash Out {Math.round(Number(bet) * mult)}
            </Button>
          ) : (
            <Button onClick={launch} className="font-display tracking-wide">
              Take Off
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
