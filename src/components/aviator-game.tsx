import { useCallback, useEffect, useRef, useState } from "react";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault } from "@/lib/vault-store";
import { sfx } from "@/lib/sfx";
import { toast } from "sonner";

type Phase = "betting" | "flying" | "crashed";
type BetState = "none" | "placed" | "active" | "cashed" | "lost";

const BETTING_SECONDS = 6;

export function AviatorGame() {
  const { user, addScore } = useVault();
  const [bet, setBet] = useState("50");
  const [mult, setMult] = useState(1);
  const [phase, setPhase] = useState<Phase>("betting");
  const [betState, setBetState] = useState<BetState>("none");
  const [countdown, setCountdown] = useState(BETTING_SECONDS);
  const [history, setHistory] = useState<number[]>([]);
  const [payout, setPayout] = useState(0);
  const crashAt = useRef(1);
  const raf = useRef<number | null>(null);
  const staked = useRef(0);
  const isSubmitting = useRef(false);
  const betStateRef = useRef<BetState>("none");
  const multRef = useRef(1);

  betStateRef.current = betState;
  multRef.current = mult;

  const stop = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  const startFlight = useCallback(() => {
    setMult(1);
    setPhase("flying");
    if (betStateRef.current === "placed") {
      setBetState("active");
      sfx.spin();
    }
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
        if (betStateRef.current === "active") {
          setBetState("lost");
          sfx.lose();
        }
        stop();
        return;
      }
      setMult(m);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [stop]);

  // Round lifecycle: betting countdown -> flight -> crash pause -> betting
  useEffect(() => {
    if (phase === "betting") {
      if (countdown <= 0) {
        startFlight();
        return;
      }
      const id = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => window.clearTimeout(id);
    }
    if (phase === "crashed") {
      const id = window.setTimeout(() => {
        setBetState("none");
        setPayout(0);
        staked.current = 0;
        setCountdown(BETTING_SECONDS);
        setPhase("betting");
      }, 3000);
      return () => window.clearTimeout(id);
    }
    return;
  }, [phase, countdown, startFlight]);

  const canBet = phase === "betting" && betState === "none";

  function placeBet() {
    if (!canBet || isSubmitting.current) return;
    isSubmitting.current = true;
    try {
      const amt = Number(bet);
      if (!user) { toast.error("Sign in or enter guest mode to play"); return; }
      if (!Number.isFinite(amt) || amt < 10) { toast.error("Minimum bet is 10 credits"); return; }
      if (amt > user.balance) { toast.error("Not enough credits — top up the vault"); return; }

      staked.current = Math.round(amt);
      addScore(-staked.current);
      setPayout(0);
      setBetState("placed");
      toast.success(`Bet of ${staked.current} placed for this round`);
    } finally {
      window.setTimeout(() => { isSubmitting.current = false; }, 300);
    }
  }

  function cashOut() {
    if (phase !== "flying" || betStateRef.current !== "active") return;
    const win = Math.round(staked.current * multRef.current);
    addScore(win);
    setPayout(win);
    setBetState("cashed");
    sfx.win();
  }

  const statusText =
    phase === "betting"
      ? betState === "placed"
        ? `Bet locked — take off in ${countdown}s`
        : `Betting open — ${countdown}s`
      : phase === "crashed"
        ? betState === "lost"
          ? "Flew away — bet lost."
          : "Round over — next round starting…"
        : betState === "cashed"
          ? `Cashed out +${payout} credits`
          : betState === "active"
            ? "Cash out before it flies away!"
            : "Watching this round — bet on the next one.";

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
                phase === "crashed" ? "text-destructive" : betState === "cashed" ? "text-success" : "neon-text"
              }`}
            >
              {phase === "betting" ? `${countdown}s` : `${mult.toFixed(2)}×`}
            </p>
          </div>
          <p className="absolute inset-x-0 bottom-3 text-center text-sm text-muted-foreground">{statusText}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="av-bet">Bet (credits)</Label>
            <Input
              id="av-bet"
              className="w-32"
              inputMode="numeric"
              value={bet}
              disabled={!canBet}
              onChange={(e) => setBet(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          {betState === "active" ? (
            <Button onClick={cashOut} className="font-display tracking-wide">
              Cash Out {Math.round(staked.current * mult)}
            </Button>
          ) : (
            <Button onClick={placeBet} disabled={!canBet} className="font-display tracking-wide">
              {betState === "placed"
                ? `Bet Placed (${staked.current})`
                : betState === "cashed"
                  ? `Cashed Out +${payout}`
                  : betState === "lost"
                    ? "Bet Lost"
                    : phase === "betting"
                      ? "Place Bet"
                      : "Waiting for next round"}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
