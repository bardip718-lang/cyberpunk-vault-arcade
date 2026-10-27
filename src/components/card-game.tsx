import { useCallback, useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoGame } from "@/lib/use-demo-game";
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
  const { balance, change: addScore } = useDemoGame();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionLock = useRef(false);
  const cardsRef = useRef<Card[]>([]);
  const pickedRef = useRef<number[]>([]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const [cards, setCards] = useState<Card[]>(deal);
  const [picked, setPicked] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [active, setActive] = useState(false);
  const [sound, setSound] = useState(true);
  const [locked, setLocked] = useState(false);

  const play = useCallback((fn: () => void) => sound && fn(), [sound]);

  function start() {
    if (balance < ENTRY) {
      toast.error("Not enough demo coins");
      return;
    }
    if (!addScore(-ENTRY)) return;
    if (timer.current) clearTimeout(timer.current);
    actionLock.current = false;
    pickedRef.current = [];
    const nextDeal = deal();
    cardsRef.current = nextDeal;
    setCards(nextDeal);
    setPicked([]);
    setMoves(0);
    setLocked(false);
    setActive(true);
  }

  function flip(id: number) {
    if (!active || actionLock.current || locked) return;
    const current = cardsRef.current;
    const card = current[id];
    if (!card) return;
    if (card.flipped || card.matched) return;
    play(sfx.flip);
    const next = current.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    const sel = [...pickedRef.current, id];
    pickedRef.current = sel;
    cardsRef.current = next;
    setCards(next);
    setPicked(sel);

    if (sel.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = sel as [number, number];
      if (next[a]?.icon === next[b]?.icon) {
        play(sfx.match);
        const matched = next.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c));
        setCards(matched);
        cardsRef.current = matched;
        pickedRef.current = [];
        setPicked([]);
        addScore(MATCH_REWARD);
        if (matched.every((c) => c.matched)) {
          addScore(CLEAR_BONUS);
          setActive(false);
          play(sfx.win);
          toast.success(`Grid cleared! Bonus +${CLEAR_BONUS} credits`);
        }
      } else {
        actionLock.current = true;
        setLocked(true);
        timer.current = setTimeout(() => {
          cardsRef.current = cardsRef.current.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c));
          setCards(cardsRef.current);
          pickedRef.current = [];
          actionLock.current = false;
          setPicked([]);
          setLocked(false);
        }, 700);
      }
    }
  }

  return (
    <section className="vault-dashboard">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl neon-text">Data Match</h2>
          <p className="text-sm text-muted-foreground">
            Demo balance {balance} · Entry {ENTRY} coins · +{MATCH_REWARD} per match · +{CLEAR_BONUS} clear bonus
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
          <Button
            variant="outline"
            disabled={!active || locked || c.flipped || c.matched}
            data-revealed={c.flipped || c.matched}
            key={c.id}
            onClick={() => flip(c.id)}
            aria-label={c.flipped || c.matched ? `Card ${c.icon}` : "Hidden card"}
            className={`card-face h-auto flex aspect-square items-center justify-center rounded-md border text-2xl transition-all duration-200 ${
              c.matched
                ? "border-success/60 bg-success/15 text-success"
                : c.flipped
                  ? "border-primary/60 bg-secondary text-primary"
                  : "border-border bg-background/70 text-muted-foreground hover:border-accent/60"
            } ${!active ? "opacity-70" : ""}`}
          >
            {c.flipped || c.matched ? c.icon : "?"}
          </Button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {active ? `Moves: ${moves}` : "Start a run to unlock the grid."}
      </p>
    </section>
  );
}
