import { useCallback, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVault } from "@/lib/vault-store";
import { sfx } from "@/lib/sfx";
import { toast } from "sonner";

const SYMBOLS = ["◈", "⚡", "☣", "✦", "⌬", "☠", "7"];
const COLS = 5;
const ROWS = 3;
const BET = 20;

const randGrid = () =>
  Array.from({ length: COLS }, () =>
    Array.from({ length: ROWS }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]!),
  );

export function ReelGame() {
  const { user, addScore } = useVault();
  const [grid, setGrid] = useState<string[][]>(randGrid);
  const [spinning, setSpinning] = useState<boolean[]>(() => Array(COLS).fill(false));
  const [sound, setSound] = useState(true);
  const [message, setMessage] = useState("Insert credits. Pull the line.");
  const [lastWin, setLastWin] = useState(0);
  const busy = useRef(false);

  const play = useCallback(
    (fn: () => void) => {
      if (sound) fn();
    },
    [sound],
  );

  function evaluate(final: string[][]) {
    let win = 0;
    const hits: string[] = [];
    for (let r = 0; r < ROWS; r++) {
      const row = final.map((col) => col[r]!);
      let run = 1;
      for (let c = 1; c < COLS; c++) {
        if (row[c] === row[c - 1]) run++;
        else break;
      }
      if (run >= 3) {
        const mult = run === 3 ? 3 : run === 4 ? 8 : 25;
        win += BET * mult;
        hits.push(`Line ${r + 1}: ${run}× ${row[0]} (+${BET * mult})`);
      }
    }
    return { win, hits };
  }

  async function spin() {
    if (busy.current) return;
    if (!user) {
      toast.error("Sign in or enter guest mode to play");
      return;
    }
    if (user.balance < BET) {
      toast.error("Not enough credits — top up the vault");
      return;
    }
    busy.current = true;
    addScore(-BET);
    setLastWin(0);
    setMessage("Spinning...");
    setSpinning(Array(COLS).fill(true));
    play(sfx.spin);

    const target = randGrid();
    const shuffle = setInterval(() => setGrid(randGrid()), 70);

    for (let c = 0; c < COLS; c++) {
      await new Promise((res) => setTimeout(res, 420));
      setSpinning((s) => s.map((v, i) => (i === c ? false : v)));
      setGrid((g) => g.map((col, i) => (i <= c ? target[i]! : col)));
      play(sfx.tick);
    }
    clearInterval(shuffle);
    setGrid(target);

    const { win, hits } = evaluate(target);
    if (win > 0) {
      addScore(win);
      setLastWin(win);
      setMessage(hits.join("  •  "));
      play(sfx.win);
      toast.success(`Payout +${win} credits`);
    } else {
      setMessage("No line. Re-run the sequence.");
      play(sfx.lose);
    }
    busy.current = false;
  }

  return (
    <section className="neon-panel rounded-xl p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl neon-text">Neon Reels 3×5</h2>
          <p className="text-sm text-muted-foreground">Bet {BET} credits · 3+ matching from the left pays</p>
        </div>
        <Button
          variant="secondary"
          size="icon"
          aria-label={sound ? "Mute sound" : "Unmute sound"}
          onClick={() => setSound((s) => !s)}
        >
          {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </Button>
      </header>

      <div className="grid grid-cols-5 gap-2 rounded-lg border border-border bg-background/60 p-3">
        {grid.map((col, c) => (
          <div key={c} className="flex flex-col gap-2">
            {col.map((sym, r) => (
              <div
                key={r}
                className={`flex aspect-square items-center justify-center rounded-md border border-border bg-secondary/60 text-2xl sm:text-3xl ${
                  spinning[c] ? "animate-reel text-muted-foreground" : "text-primary"
                }`}
              >
                {sym}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex items-center gap-3">
          {lastWin > 0 && <span className="font-display text-success">+{lastWin}</span>}
          <Button onClick={spin} className="font-display tracking-widest animate-neon-pulse">
            SPIN
          </Button>
        </div>
      </div>
    </section>
  );
}
