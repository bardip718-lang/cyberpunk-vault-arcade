import { useState } from "react";
import { Bomb, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault } from "@/lib/vault-store";
import { sfx } from "@/lib/sfx";
import { toast } from "sonner";

const SIZE = 25;
const MINES = 5;

function layMines() {
  const set = new Set<number>();
  while (set.size < MINES) set.add(Math.floor(Math.random() * SIZE));
  return set;
}

function multiplier(picks: number) {
  let m = 1;
  for (let i = 0; i < picks; i++) m *= (SIZE - i) / (SIZE - MINES - i);
  return Number((m * 0.96).toFixed(2));
}

export function MinesGame() {
  const { user, addScore } = useVault();
  const [bet, setBet] = useState("50");
  const [mines, setMines] = useState<Set<number>>(() => new Set<number>());
  const [revealed, setRevealed] = useState<number[]>([]);
  const [active, setActive] = useState(false);
  const [dead, setDead] = useState(false);
  const [stake, setStake] = useState(0);

  const mult = multiplier(revealed.length);

  function start() {
    const amt = Number(bet);
    if (!user) return toast.error("Sign in or enter guest mode to play");
    if (!Number.isFinite(amt) || amt < 10) return toast.error("Minimum bet is 10 credits");
    if (amt > user.balance) return toast.error("Not enough credits — top up the vault");
    addScore(-Math.round(amt));
    setStake(Math.round(amt));
    setMines(layMines());
    setRevealed([]);
    setDead(false);
    setActive(true);
    sfx.tick();
  }

  function pick(i: number) {
    if (!active || revealed.includes(i)) return;
    if (mines.has(i)) {
      setDead(true);
      setActive(false);
      sfx.lose();
      toast.error("Mine hit — stake lost");
      return;
    }
    sfx.match();
    setRevealed((r) => [...r, i]);
  }

  function cashOut() {
    if (!active || revealed.length === 0) return;
    const win = Math.round(stake * mult);
    addScore(win);
    setActive(false);
    sfx.win();
    toast.success(`Cashed out +${win} credits at ${mult}×`);
  }

  return (
    <section className="space-y-6">
      <div className="neon-panel rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl neon-text">Mines</h2>
          <p className="text-sm text-muted-foreground">
            {MINES} mines hidden · current multiplier{" "}
            <span className="font-display text-accent">{mult}×</span>
          </p>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2">
          {Array.from({ length: SIZE }, (_, i) => {
            const open = revealed.includes(i);
            const boom = dead && mines.has(i);
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={!active}
                className={`flex aspect-square items-center justify-center rounded-md border transition-colors ${
                  boom
                    ? "border-destructive bg-destructive/20"
                    : open
                      ? "border-primary bg-primary/15"
                      : "border-border bg-secondary/40 hover:bg-secondary"
                }`}
                aria-label={`Tile ${i + 1}`}
              >
                {boom ? (
                  <Bomb className="size-5 text-destructive" />
                ) : open ? (
                  <Gem className="size-5 text-primary" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="mn-bet">Bet (credits)</Label>
            <Input
              id="mn-bet"
              className="w-32"
              inputMode="numeric"
              value={bet}
              disabled={active}
              onChange={(e) => setBet(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          {active ? (
            <Button onClick={cashOut} variant="secondary" className="font-display tracking-wide">
              Cash Out {Math.round(stake * mult)}
            </Button>
          ) : (
            <Button onClick={start} className="font-display tracking-wide">
              New Round
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
