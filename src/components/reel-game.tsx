import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Minus, Plus } from "lucide-react";

type SymbolType = "wild" | "ruby" | "emerald" | "sapphire" | "A" | "K" | "Q";

const SYMBOLS: SymbolType[] = ["wild", "ruby", "emerald", "sapphire", "A", "K", "Q"];
const WEIGHTS = [5, 12, 16, 18, 17, 17, 15]; // wild is rare

// Paytable: multiplier of total bet for 3 / 4 / 5 of a kind on a row
const PAY: Record<SymbolType, [number, number, number]> = {
  wild: [5, 15, 50],
  ruby: [3, 8, 25],
  emerald: [2, 5, 15],
  sapphire: [2, 4, 12],
  A: [1, 2, 6],
  K: [0.8, 1.5, 4],
  Q: [0.5, 1, 3],
};

const BG = "/assets/temple-bg.jpg";

function pickSymbol(): SymbolType {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= WEIGHTS[i]!;
    if (r <= 0) return SYMBOLS[i]!;
  }
  return "Q";
}

/* ---------- SYMBOL TILES ---------- */

const GarudaWild = ({ glow = false }: { glow?: boolean }) => (
  <div
    className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border-2 bg-gradient-to-b from-[#3A1B08] to-[#1A0C02] ${
      glow ? "border-yellow-300 shadow-[0_0_18px_#FACC15]" : "border-amber-700/80"
    }`}
  >
    <img
      src="/assets/garuda-wild.png"
      alt="Garuda WILD symbol"
      loading="lazy"
      width={1024}
      height={1024}
      className={`h-[78%] w-[78%] object-contain drop-shadow-[0_0_10px_rgba(250,204,21,0.7)] ${
        glow ? "animate-pulse" : ""
      }`}
    />
    <span className="absolute bottom-0.5 rounded bg-red-700/90 px-1.5 text-[7px] font-black tracking-[0.2em] text-yellow-100">
      WILD
    </span>
  </div>
);

const GEM_SRC: Record<"ruby" | "emerald" | "sapphire", string> = {
  ruby: "/assets/ruby.png",
  emerald: "/assets/emerald.png",
  sapphire: "/assets/sapphire.png",
};

const Gem = ({ type }: { type: "ruby" | "emerald" | "sapphire" }) => (
  <div className="flex h-full w-full items-center justify-center rounded-lg border border-yellow-700/60 bg-gradient-to-b from-[#331808] to-[#1A0C02] p-1">
    <img
      src={GEM_SRC[type]}
      alt={`${type} gem symbol`}
      loading="lazy"
      width={1024}
      height={1024}
      className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]"
    />
  </div>
);

function SymbolTile({ s, glow }: { s: SymbolType; glow: boolean }) {
  if (s === "wild") return <GarudaWild glow={glow} />;
  if (s === "ruby" || s === "emerald" || s === "sapphire") return <Gem type={s} />;
  return (
    <div
      className={`flex h-full items-center justify-center rounded-lg border bg-gradient-to-b from-[#331808] to-[#1A0C02] text-2xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
        glow
          ? "border-yellow-300 text-yellow-200 shadow-[0_0_14px_rgba(250,204,21,0.5)]"
          : "border-yellow-700/60 text-yellow-300/90"
      }`}
    >
      {s}
    </div>
  );
}

/* ---------- GAME ---------- */

const COLS = 5;
const ROWS = 3;

export function ReelGame() {
  // Demo/virtual coins only — not connected to the real wallet.
  const [balance, setBalance] = useState(2000);
  const [bet, setBet] = useState(30);
  const [win, setWin] = useState(0);
  const [winCells, setWinCells] = useState<Set<string>>(new Set());
  const [sound, setSound] = useState(true);
  const [spinning, setSpinning] = useState(false);
  // Per-column stopped flags drive the staggered stop animation
  const [stopped, setStopped] = useState<boolean[]>(Array(COLS).fill(true));
  const [shake, setShake] = useState(false);

  const [grid, setGrid] = useState<SymbolType[][]>(() =>
    Array.from({ length: COLS }, () => [pickSymbol(), pickSymbol(), pickSymbol()])
  );

  const audioRef = useRef<AudioContext | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    const intervals = intervalsRef.current;
    return () => {
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
  }, []);

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  };

  const tone = (freq: number, dur = 0.12, type: OscillatorType = "sine", vol = 0.1) => {
    if (!sound) return;
    try {
      audioRef.current ??= new AudioContext();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      // audio unavailable
    }
  };

  const winJingle = () => {
    [523, 659, 784, 1047].forEach((f, i) => later(() => tone(f, 0.18, "triangle", 0.12), i * 90));
  };

  // Evaluate all 3 rows: left-to-right matches with wild substitution
  const evaluate = (g: SymbolType[][]) => {
    let total = 0;
    const cells = new Set<string>();
    for (let row = 0; row < ROWS; row++) {
      const line = g.map((col) => col[row]!);
      // candidate symbols = non-wild symbols present; if all wild, use wild
      const candidates = line.filter((s) => s !== "wild");
      const targets: SymbolType[] = candidates.length
        ? [...new Set(candidates)]
        : ["wild"];
      let best = 0;
      let bestLen = 0;
      for (const t of targets) {
        let len = 0;
        for (const s of line) {
          if (s === t || s === "wild") len++;
          else break;
        }
        if (len >= 3) {
          const pay = PAY[t][len - 3]! * bet;
          if (pay > best) {
            best = pay;
            bestLen = len;
          }
        }
      }
      if (best > 0) {
        total += best;
        for (let c = 0; c < bestLen; c++) cells.add(`${c}-${row}`);
      }
    }
    return { total: Math.round(total), cells };
  };

  const spin = () => {
    if (spinning || balance < bet) return;

    setSpinning(true);
    setWin(0);
    setWinCells(new Set());
    setBalance((b) => b - bet);
    setStopped(Array(COLS).fill(false));
    tone(240, 0.15, "triangle", 0.08);

    // Final result decided up-front — the animation lands on these symbols
    const finalGrid = Array.from({ length: COLS }, () => [
      pickSymbol(),
      pickSymbol(),
      pickSymbol(),
    ]);

    // Each column cycles symbols vertically (reel-strip motion) until it stops
    finalGrid.forEach((finalCol, col) => {
      const iv = setInterval(() => {
        setGrid((prev) => {
          const next = prev.map((c) => [...c]);
          next[col] = [pickSymbol(), next[col]![0]!, next[col]![1]!];
          return next;
        });
      }, 70);
      intervalsRef.current.push(iv);

      // Staggered stop: left to right
      later(() => {
        clearInterval(iv);
        setGrid((prev) => {
          const next = prev.map((c) => [...c]);
          next[col] = finalCol;
          return next;
        });
        setStopped((prev) => {
          const next = [...prev];
          next[col] = true;
          return next;
        });
        tone(160, 0.08, "sine", 0.09);
      }, 700 + col * 350);
    });

    // Settle after the last column lands
    later(() => {
      const { total, cells } = evaluate(finalGrid);
      if (total > 0) {
        setWin(total);
        setWinCells(cells);
        setBalance((b) => b + total);
        winJingle();
        if (total >= bet * 10) {
          setShake(true);
          later(() => setShake(false), 450);
        }
      }
      setSpinning(false);
    }, 700 + COLS * 350 + 150);
  };

  const winTier = win >= bet * 25 ? "JACKPOT" : win >= bet * 8 ? "BIG WIN" : "NICE WIN";

  return (
    <div
      className={`relative mx-auto w-full max-w-md select-none overflow-hidden rounded-3xl border-4 border-amber-700 bg-[#140802] text-white shadow-2xl ${
        shake ? "animate-[reelShake_.4s]" : ""
      }`}
    >
      <style>{`
        @keyframes reelShake{
          0%,100%{transform:translateX(0)}
          25%{transform:translateX(-4px)}
          50%{transform:translateX(4px)}
          75%{transform:translateX(-3px)}
        }
        @keyframes coinFall{
          0%{transform:translateY(-10%);opacity:0}
          15%{opacity:1}
          100%{transform:translateY(110%);opacity:0}
        }
        @keyframes landBounce{
          0%{transform:translateY(-8%)}
          60%{transform:translateY(3%)}
          100%{transform:translateY(0)}
        }
        .reel-land{animation:landBounce .28s ease-out}
      `}</style>

      {/* Temple backdrop */}
      <img
        src={BG}
        alt=""
        aria-hidden
        width={768}
        height={1344}
        className="absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#1A0C02]/75 to-[#140802]" />

      {/* Win particles */}
      {win > 0 && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-yellow-300"
              style={{
                left: `${(i * 61) % 100}%`,
                animation: `coinFall ${1.1 + (i % 4) * 0.3}s ease-in ${i * 0.07}s forwards`,
                boxShadow: "0 0 8px #FACC15",
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-700/80 bg-[#2B1406]/90 px-3 py-2">
          <div>
            <div className="text-[9px] font-bold tracking-[0.35em] text-yellow-300">
              TEMPLE OF FORTUNE
            </div>
            <h1 className="text-lg font-black italic leading-tight text-yellow-100">
              GARUDA GEMS
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-yellow-600/60 bg-[#1A0C02] px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-yellow-300">
              Demo coins
            </span>
            <button
              type="button"
              onClick={() => setSound(!sound)}
              aria-label={sound ? "Mute sound" : "Enable sound"}
              className="rounded-full border border-yellow-500 bg-[#3A1B08] p-2 transition-colors hover:bg-[#4B2408]"
            >
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>

        {/* Reel frame: 5 columns x 3 rows */}
        <div className="mx-3 mt-3 rounded-2xl border-2 border-amber-500/80 bg-[#241003]/90 p-2 shadow-[inset_0_0_18px_rgba(0,0,0,.8),0_0_24px_rgba(245,158,11,0.25)]">
          <div className="grid grid-cols-5 gap-1.5">
            {grid.map((col, c) => (
              <div
                key={c}
                className={`space-y-1.5 ${stopped[c] ? "reel-land" : ""}`}
              >
                {col.map((s, r) => (
                  <div
                    key={r}
                    className={`h-[64px] overflow-hidden rounded-lg transition-[filter] duration-200 sm:h-[72px] ${
                      !stopped[c] ? "blur-[2px] brightness-90" : ""
                    }`}
                  >
                    <SymbolTile s={s} glow={winCells.has(`${c}-${r}`)} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Win panel */}
        <div className="px-3 pt-3 text-center" aria-live="polite">
          {win > 0 ? (
            <>
              <div className="text-[10px] font-bold tracking-[0.3em] text-yellow-300">
                {winTier}
              </div>
              <div className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]">
                +{win} coins
              </div>
            </>
          ) : (
            <div className="text-[11px] text-yellow-100/70">
              Match 3+ symbols left-to-right on any row
            </div>
          )}
          <div className="mt-1 text-[11px] font-bold text-yellow-100">
            Demo balance: {balance} coins
          </div>
        </div>

        {/* Controls */}
        <div className="p-3">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setBet(Math.max(10, bet - 10))}
              disabled={spinning}
              aria-label="Decrease bet"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-yellow-600 bg-[#3A1B08] transition-colors hover:bg-[#4B2408] disabled:opacity-40"
            >
              <Minus size={18} />
            </button>

            <div className="text-center">
              <div className="text-[9px] font-bold tracking-widest text-yellow-300">
                TOTAL BET
              </div>
              <div className="text-xl font-black">{bet} coins</div>
            </div>

            <button
              type="button"
              onClick={() => setBet(bet + 10)}
              disabled={spinning}
              aria-label="Increase bet"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-yellow-600 bg-[#3A1B08] transition-colors hover:bg-[#4B2408] disabled:opacity-40"
            >
              <Plus size={18} />
            </button>
          </div>

          <button
            type="button"
            disabled={spinning || balance < bet}
            onClick={spin}
            className="w-full rounded-2xl bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-800 py-4 text-xl font-black tracking-widest text-black shadow-[0_0_25px_#F59E0B] transition-all active:scale-95 disabled:opacity-50"
          >
            {spinning ? "SPINNING…" : balance < bet ? "OUT OF COINS" : "SPIN"}
          </button>
          <p className="mt-2 text-center text-[9px] text-yellow-100/50">
            Free demo play with virtual coins only. No real-money prizes.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReelGame;
