import React, { useState, useRef } from "react";
import { Volume2, VolumeX, Sparkles, Flame, Plus, Minus } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";
import { WinCelebration, tierFor, type WinTier } from "@/components/win-celebration";

// Authentic Sound Synthesizer for Aztec Slot Clicks, Reel Stoppage & Fanfare
const playTempleSound = (type: "spin" | "stop" | "win" | "bigwin" | "click") => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "spin") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "stop") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(190, ctx.currentTime);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "win") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.2);
      });
    } else if (type === "bigwin") {
      [440, 554, 659, 880, 1108, 1318].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.09);
        osc.stop(ctx.currentTime + i * 0.09 + 0.25);
      });
    } else if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    }
  } catch {
    // Audio handle
  }
};

// High-Relief Aztec Golden Tile & Gemstones (JILI Fortune Gems Style)
function FortuneTile({ id }: { id: string }) {
  if (id === "garuda") {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-md border-2 border-[#fef08a] bg-gradient-to-b from-[#fde047] via-[#ca8a04] to-[#713f12] p-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_10px_rgba(0,0,0,0.8)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200/40 via-transparent to-black/30" />
        <svg viewBox="0 0 100 100" className="size-11 drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] z-10">
          <defs>
            <linearGradient id="garudaGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="35%" stopColor="#facc15" />
              <stop offset="85%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
          </defs>
          <path d="M50 4 L88 24 L88 76 L50 96 L12 76 L12 24 Z" fill="url(#garudaGold)" stroke="#fef08a" strokeWidth="2.5" />
          <path d="M50 18 L76 34 L76 66 L50 82 L24 66 L24 34 Z" fill="#ca8a04" opacity="0.4" />
          {/* Crimson Mask Eyes */}
          <ellipse cx="36" cy="42" rx="7" ry="5" fill="#dc2626" stroke="#fff" strokeWidth="1" />
          <ellipse cx="64" cy="42" rx="7" ry="5" fill="#dc2626" stroke="#fff" strokeWidth="1" />
          {/* Beak & Crest */}
          <polygon points="50,44 42,62 58,62" fill="#fef08a" stroke="#854d0e" strokeWidth="1.5" />
          <path d="M38 72 Q50 82 62 72" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
        <span className="z-10 text-[9px] font-black tracking-widest text-amber-100 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] -mt-1">
          WILD
        </span>
      </div>
    );
  }

  if (id === "ruby") {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center rounded-md border-2 border-[#ca8a04] bg-gradient-to-b from-[#eab308] via-[#a16207] to-[#451a03] p-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_10px_rgba(0,0,0,0.7)]">
        <div className="relative size-10 rounded-full border-2 border-[#fb7185] bg-gradient-to-br from-[#fda4af] via-[#e11d48] to-[#4c0519] flex items-center justify-center shadow-[0_0_12px_rgba(225,29,72,0.8),inset_0_2px_4px_rgba(255,255,255,0.7)]">
          <div className="size-5 rotate-45 border border-white/60 bg-white/20" />
        </div>
      </div>
    );
  }

  if (id === "sapphire") {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center rounded-md border-2 border-[#ca8a04] bg-gradient-to-b from-[#eab308] via-[#a16207] to-[#451a03] p-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_10px_rgba(0,0,0,0.7)]">
        <div className="relative size-10 rotate-45 border-2 border-[#60a5fa] bg-gradient-to-br from-[#bfdbfe] via-[#2563eb] to-[#082f49] flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.8),inset_0_2px_4px_rgba(255,255,255,0.7)]">
          <div className="size-4 border border-white/60 bg-white/30" />
        </div>
      </div>
    );
  }

  if (id === "emerald") {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center rounded-md border-2 border-[#ca8a04] bg-gradient-to-b from-[#eab308] via-[#a16207] to-[#451a03] p-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_10px_rgba(0,0,0,0.7)]">
        <div className="relative size-10 rounded-full border-2 border-[#34d399] bg-gradient-to-br from-[#a7f3d0] via-[#059669] to-[#022c22] flex items-center justify-center shadow-[0_0_12px_rgba(5,150,105,0.8),inset_0_2px_4px_rgba(255,255,255,0.7)]">
          <div className="size-5 rounded-full border border-white/50 bg-white/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center rounded-md border-2 border-[#ca8a04] bg-gradient-to-b from-[#eab308] via-[#a16207] to-[#451a03] p-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_10px_rgba(0,0,0,0.7)]">
      <span className="font-display text-2xl font-black text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
        {id}
      </span>
    </div>
  );
}

// Special Wheel Medallion Tiles (5x, 10x, 15x, Wheel)
function MultiplierMedallion({ val }: { val: string | number }) {
  if (val === "WHEEL") {
    return (
      <div className="flex size-11 items-center justify-center rounded-full border-2 border-yellow-300 bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-300 shadow-[0_0_12px_#facc15] animate-spin">
        <Sparkles className="size-5 text-white" />
      </div>
    );
  }

  const num = Number(val);
  const colorScheme =
    num >= 15
      ? "from-[#dc2626] via-[#991b1b] to-[#450a0a] border-[#f87171] text-white"
      : num >= 10
      ? "from-[#9333ea] via-[#6b21a8] to-[#3b0764] border-[#c084fc] text-yellow-200"
      : "from-[#2563eb] via-[#1d4ed8] to-[#172554] border-[#60a5fa] text-yellow-300";

  return (
    <div
      className={`flex size-11 items-center justify-center rounded-full border-2 bg-gradient-to-b ${colorScheme} shadow-[0_4px_8px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.6)]`}
    >
      <span className="font-display text-sm font-black tracking-tighter drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
        {num}x
      </span>
    </div>
  );
}

const SYMBOLS = [
  { id: "garuda", pay: 20 },
  { id: "ruby", pay: 10 },
  { id: "sapphire", pay: 6 },
  { id: "emerald", pay: 4 },
  { id: "A", pay: 2 },
  { id: "K", pay: 1.5 },
  { id: "Q", pay: 1 },
];

export function ReelGame() {
  const { user, addScore } = useVault();

  const [baseBet, setBaseBet] = useState<number>(10);
  const [extraBetMode, setExtraBetMode] = useState<boolean>(false);
  const [sound, setSound] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number>(0);

  const [celebration, setCelebration] = useState<{ tier: WinTier; amount: number; key: number } | null>(null);
  const [shake, setShake] = useState(false);
  const busy = useRef(false);

  // 3x3 Aztec Reels
  const [grid, setGrid] = useState<string[][]>([
    ["garuda", "ruby", "sapphire"],
    ["ruby", "garuda", "emerald"],
    ["sapphire", "emerald", "A"],
  ]);

  // 4th Column Special Wheel Stack
  const [specialReel, setSpecialReel] = useState<(number | string)[]>([5, 10, 15]);

  const totalBet = extraBetMode ? Math.round(baseBet * 1.5) : baseBet;

  const getMultiplierPool = () => {
    return extraBetMode ? [2, 3, 5, 10, 15, "WHEEL"] : [1, 2, 3, 5, 10, 15, "WHEEL"];
  };

  const pickSymbol = () => {
    const rand = Math.random();
    if (rand < 0.08) return "garuda";
    if (rand < 0.22) return "ruby";
    if (rand < 0.42) return "sapphire";
    if (rand < 0.62) return "emerald";
    if (rand < 0.76) return "A";
    if (rand < 0.88) return "K";
    return "Q";
  };

  const handleBetChange = (delta: number) => {
    if (spinning) return;
    if (sound) playTempleSound("click");
    const bets = [5, 10, 20, 50, 100, 200];
    const currIdx = bets.indexOf(baseBet);
    let nextIdx = currIdx + delta;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= bets.length) nextIdx = bets.length - 1;
    setBaseBet(bets[nextIdx]);
  };

  const spin = () => {
    if (busy.current || spinning) return;
    if (!user || user.balance < totalBet) {
      toast.error("Not enough credits — top up the vault!");
      return;
    }

    busy.current = true;
    setSpinning(true);
    addScore(-totalBet);
    setLastWin(0);
    setCelebration(null);
    if (sound) playTempleSound("spin");

    const pool = getMultiplierPool();
    let cycles = 0;

    const interval = setInterval(() => {
      cycles++;
      if (sound && cycles % 2 === 0) playTempleSound("spin");

      setGrid([
        [pickSymbol(), pickSymbol(), pickSymbol()],
        [pickSymbol(), pickSymbol(), pickSymbol()],
        [pickSymbol(), pickSymbol(), pickSymbol()],
      ]);

      setSpecialReel([
        pool[Math.floor(Math.random() * pool.length)],
        pool[Math.floor(Math.random() * pool.length)],
        pool[Math.floor(Math.random() * pool.length)],
      ]);

      if (cycles > 15) {
        clearInterval(interval);
        if (sound) playTempleSound("stop");

        const targetGrid = [
          [pickSymbol(), pickSymbol(), pickSymbol()],
          [pickSymbol(), pickSymbol(), pickSymbol()],
          [pickSymbol(), pickSymbol(), pickSymbol()],
        ];

        const targetSpecial = [
          pool[Math.floor(Math.random() * pool.length)],
          pool[Math.floor(Math.random() * pool.length)],
          pool[Math.floor(Math.random() * pool.length)],
        ];

        setGrid(targetGrid);
        setSpecialReel(targetSpecial);
        setSpinning(false);

        // Center line evaluation (Middle Row)
        const centerMulti = targetSpecial[1];
        const c0 = targetGrid[0][1];
        const c1 = targetGrid[1][1];
        const c2 = targetGrid[2][1];

        const isMatch =
          (c0 === c1 || c0 === "garuda" || c1 === "garuda") &&
          (c1 === c2 || c1 === "garuda" || c2 === "garuda");

        if (isMatch) {
          const symId = [c0, c1, c2].find((x) => x !== "garuda") || "garuda";
          const sym = SYMBOLS.find((s) => s.id === symId) || SYMBOLS[0];
          const multVal = typeof centerMulti === "number" ? centerMulti : 20;
          const payout = Math.round(baseBet * (sym.pay / 2) * multVal);

          addScore(payout);
          setLastWin(payout);

          const tier = tierFor(multVal);
          setCelebration({ tier, amount: payout, key: Date.now() });

          if (tier !== "nice") {
            setShake(true);
            setTimeout(() => setShake(false), 600);
            if (sound) playTempleSound("bigwin");
          } else {
            if (sound) playTempleSound("win");
          }

          toast.success(`🎉 Aztec Hit! +₹${payout} (${multVal}x Multiplier!)`);
        }

        busy.current = false;
      }
    }, 75);
  };

  return (
    <div
      className={`relative mx-auto max-w-sm overflow-hidden rounded-3xl border-4 border-[#b45309] bg-gradient-to-b from-[#2a1706] via-[#150a02] to-[#0a0501] p-2.5 shadow-2xl font-sans select-none text-slate-100 ${
        shake ? "animate-win-shake" : ""
      }`}
    >
      <WinCelebration
        key={celebration?.key ?? "idle"}
        active={!!celebration}
        tier={celebration?.tier ?? "nice"}
        amount={celebration?.amount ?? 0}
        onDone={() => setCelebration(null)}
      />

      {/* Top Aztec Lucky Wheel & EX Extra Bet Deck */}
      <div className="relative mb-2 overflow-hidden rounded-2xl border-2 border-amber-600/70 bg-gradient-to-b from-[#451a03] to-[#1c0c02] p-2 text-center shadow-lg">
        {/* Giant Circular Lucky Wheel Visual */}
        <div className="relative mx-auto flex size-28 items-center justify-center">
          <div
            className={`size-full rounded-full border-4 border-amber-400 bg-[conic-gradient(#f59e0b_0deg_45deg,#b45309_45deg_90deg,#ef4444_90deg_135deg,#9333ea_135deg_180deg,#3b82f6_180deg_225deg,#10b981_225deg_270deg,#f59e0b_270deg_360deg)] shadow-[0_0_20px_#f59e0b] ${
              spinning ? "animate-spin" : ""
            }`}
          />
          {/* Aztec Wheel Pointer & Hub */}
          <div className="absolute z-10 flex size-12 items-center justify-center rounded-full border-2 border-amber-300 bg-gradient-to-b from-yellow-300 to-amber-700 shadow-md">
            <Flame className="size-5 text-red-950 fill-red-600 animate-pulse" />
          </div>
          <div className="absolute -top-1 z-20 size-0 border-x-4 border-x-transparent border-t-8 border-t-yellow-300 drop-shadow" />
        </div>

        {/* 1win / JILI EX Extra Bet Pill */}
        <div className="mt-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-sm font-black italic tracking-tight text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              FORTUNE GEMS 2
            </span>
          </div>

          <button
            type="button"
            disabled={spinning}
            onClick={() => setExtraBetMode(!extraBetMode)}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-wider transition-all active:scale-95 ${
              extraBetMode
                ? "bg-gradient-to-r from-amber-500 to-yellow-500 border-yellow-300 text-slate-950 shadow-[0_0_12px_#f59e0b]"
                : "bg-[#271404] border-amber-800 text-amber-300"
            }`}
          >
            <span className="rounded bg-black/60 px-1 text-[8.5px] text-yellow-300">EX</span>
            <span>{extraBetMode ? "ON (+50%)" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* Aztec Temple Stone Frame */}
      <div className="relative rounded-2xl border-4 border-[#b45309] bg-[#120802] p-1.5 shadow-[inset_0_4px_8px_rgba(0,0,0,0.9)]">
        {/* Center Winning Payline Beam */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-transparent via-amber-300 to-transparent pointer-events-none z-30 shadow-[0_0_15px_#f59e0b]" />

        <div className="grid grid-cols-4 gap-1">
          {/* 3 Main Slot Columns */}
          {[0, 1, 2].map((c) => (
            <div key={c} className="flex flex-col gap-1">
              {[0, 1, 2].map((r) => (
                <div
                  key={r}
                  className={`aspect-square w-full rounded-lg transition-transform ${
                    r === 1 ? "scale-[1.02] z-10" : "opacity-80"
                  } ${spinning ? "blur-[0.5px]" : ""}`}
                >
                  <FortuneTile id={grid[c][r]} />
                </div>
              ))}
            </div>
          ))}

          {/* 4th Column: SPECIAL WHEEL Stack */}
          <div className="flex flex-col gap-1 rounded-lg border-2 border-amber-600/80 bg-gradient-to-b from-[#2a1304] to-[#120601] p-0.5">
            <div className="bg-[#78350f] text-center text-[7.5px] font-black uppercase tracking-wider text-amber-200 py-0.5 rounded-sm">
              SPECIAL
            </div>
            {[0, 1, 2].map((r) => (
              <div
                key={r}
                className={`flex aspect-square w-full items-center justify-center rounded-md border ${
                  r === 1
                    ? "border-amber-300 bg-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.7)] scale-[1.04] z-10"
                    : "border-amber-950/70 bg-black/40 opacity-70"
                }`}
              >
                <MultiplierMedallion val={specialReel[r]} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Yono / JILI Gold Bottom Console */}
      <div className="mt-2.5 rounded-2xl border-2 border-amber-700/60 bg-gradient-to-b from-[#261304] to-[#0c0501] p-2 shadow-xl">
        {/* Win Display & Audio */}
        <div className="flex items-center justify-between border-b border-amber-900/60 pb-1.5 px-1">
          <div className="flex items-center gap-1 text-[11px] font-black">
            <span className="text-amber-400">WIN</span>
            <span className="font-mono text-emerald-400">
              ₹{lastWin > 0 ? lastWin.toLocaleString("en-IN") : "0.00"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSound(!sound)}
              className="text-amber-400/80 hover:text-amber-200"
            >
              {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
            <div className="text-[10px] font-mono text-amber-300/80">
              Bal: <strong className="text-white">₹{user?.balance || 0}</strong>
            </div>
          </div>
        </div>

        {/* Spin & Bet Trigger Deck */}
        <div className="mt-2 flex items-center justify-between gap-2 px-1">
          {/* Bet Adjust Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={spinning}
              onClick={() => handleBetChange(-1)}
              className="flex size-7 items-center justify-center rounded-full border border-amber-600 bg-amber-950/80 text-amber-200 active:scale-95"
            >
              <MinusclassName="size-3.5" />
            </button>

            <div className="rounded-lg border border-amber-700/80 bg-black/60 px-2.5 py-1 text-center">
              <span className="block text-[8px] uppercase tracking-wider text-amber-400/80 font-bold">
                Total Bet
              </span>
              <span className="font-mono text-xs font-black text-white">₹{totalBet}</span>
            </div>

            <button
              type="button"
              disabled={spinning}
              onClick={() => handleBetChange(1)}
              className="flex size-7 items-center justify-center rounded-full border border-amber-600 bg-amber-950/80 text-amber-200 active:scale-95"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {/* Heavy Aztec Golden Coin Spin Button */}
          <button
            type="button"
            disabled={spinning}
            onClick={spin}
            className={`relative flex size-14 items-center justify-center rounded-full border-4 border-[#fef08a] bg-gradient-to-b from-[#fde047] via-[#ca8a04] to-[#713f12] shadow-[0_0_20px_#f59e0b,inset_0_2px_4px_rgba(255,255,255,0.8)] active:scale-90 transition-transform ${
              spinning ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <span className="font-display text-[11px] font-black tracking-tighter text-[#451a03] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] leading-tight">
                SPIN
              </span>
              <span className="text-[7.5px] font-black text-red-950 font-mono">
                ₹{totalBet}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReelGame;
