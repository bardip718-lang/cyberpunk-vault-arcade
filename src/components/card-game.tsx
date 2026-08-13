import { useCallback, useState } from "react";
import { Volume2, VolumeX, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVault } from "@/lib/vault-store";
import { sfx } from "@/lib/sfx";
import { toast } from "sonner";

const ICONS = ["◈", "⚡", "☣", "✦", "⌬", "☠"];
const ENTRY = 30;
const MATCH_REWARD = 12;
const CLEAR_BONUS = 60;

type Card = { id: number; icon: string; flipped: boolean; matched: boolean };

function deal(): Card[] {
  return [...ICONS, ...ICONS]
    .map((icon, i) => ({ id: i, icon, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5)
    .map((c, i) => ({ ...c, id: i }));
}

export function CardGame() {
  const { user, addScore } = useVault();
  const [cards, setCards] = useState<Card[]>(deal);
  const [picked, setPicked] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [active, setActive] = useState(false);
  const [sound, setSound] = useState(true);
  const [locked, setLocked] = useState(false);

  const play = useCallback((fn: () => void) => sound && fn(), [sound]);

  function start() {
    if (!user) {
      toast.error("Sign in or enter guest mode to play");
      return;
    }
    if (user.balance < ENTRY) {
      toast.error("Not enough credits — top up the vault");
      return;
    }
    addScore(-ENTRY);
    setCards(deal());
    setPicked([]);
    setMoves(0);
    setLocked(false);
    setActive(true);
  }

  function flip(id: number) {
    if (!active || locked) return;
    const card = cards[id]!;
    if (card.flipped || card.matched) return;
    play(sfx.flip);
    const next = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    const sel = [...picked, id];
    setCards(next);
    setPicked(sel);

    if (sel.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = sel as [number, number];
      if (next[a]!.icon === next[b]!.icon) {
        play(sfx.match);
        const matched = next.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c));
        setCards(matched);
        setPicked([]);
        addScore(MATCH_REWARD);
        if (matched.every((c) => c.matched)) {
          addScore(CLEAR_BONUS);
          setActive(false);
          play(sfx.win);
          toast.success(`Grid cleared! Bonus +${CLEAR_BONUS} credits`);
        }
      } else {
        setLocked(true);
        setTimeout(() => {
          setCards((cs) => cs.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c)));
          setPicked([]);
          setLocked(false);
        }, 700);
      }
    }
  }

  return (
    <section className="neon-panel rounded-xl p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl neon-text">Data Match</h2>
          <p className="text-sm text-muted-foreground">
            Entry {ENTRY} credits · +{MATCH_REWARD} per match · +{CLEAR_BONUS} clear bonus
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            aria-label={sound ? "Mute sound" : "Unmute sound"}
            onClick={() => setSound((s) => !s)}
          >
            {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </Button>
          <Button onClick={start} className="font-display">
            <RotateCcw className="size-4" /> {active ? "Restart" : "Start run"}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => flip(c.id)}
            aria-label={c.flipped || c.matched ? `Card ${c.icon}` : "Hidden card"}
            className={`flex aspect-square items-center justify-center rounded-md border text-2xl transition-all duration-200 ${
              c.matched
                ? "border-success/60 bg-success/15 text-success"
                : c.flipped
                  ? "border-primary/60 bg-secondary text-primary"
                  : "border-border bg-background/70 text-muted-foreground hover:border-accent/60"
            } ${!active ? "opacity-70" : ""}`}
          >
            {c.flipped || c.matched ? c.icon : "?"}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {active ? `Moves: ${moves}` : "Start a run to unlock the grid."}
      </p>
    </section>
  );
}
