import React, { useState, useRef } from "react";
import { Volume2, VolumeX, Sparkles, Flame, Plus, Minus } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";
import { WinCelebration, tierFor, type WinTier } from "@/components/win-celebration";

// Authentic sound synthesizer
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
  } catch {}
};

// High-fidelity rendered PNG assets matching JILI Fortune Gems 2
const TILE_ASSETS: Record<string, { image: string; fallbackText?: string }> = {
  garuda: {
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
  },
  ruby: {
    image: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?w=200&auto=format&fit=crop&q=80",
  },
  sapphire: {
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&auto=format&fit=crop&q=80",
  },
  emerald: {
    image: "https://images.unsplash.com/photo-1615655406736-b37c4fabf923?w=200&auto=format&fit=crop&q=80",
  },
  A: {
    image: "",
    fallbackText: "A",
  },
  K: {
    image: "",
    fallbackText: "K",
  },
  Q: {
    image: "",
    fallbackText: "Q",
  },
};

function JiliSlotTile({ id }: { id: string }) {
  const asset = TILE_ASSETS[id];

  if (id === "garuda") {
    return (
      <div className="relative w-full h-full rounded-[4px] overflow-hidden border-[2.5px] border-[#ffe875] bg-gradient-to-b from-[#fcd34d] via-[#b45309] to-[#3a1502] p-[1px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_6px_12px_rgba(0,0,0,0.9)] flex flex-col items-center justify-between">
        <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30" style={{ backgroundImage: `url(${asset.image})` }} />
        
        {/* Deep 3D Relief Gold Garuda Mask */}
        <svg viewBox="0 0 100 85" className="w-[90%] h-[75%] drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)] z-10 mt-0.5">
          <defs>
            <linearGradient id="gGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="85%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <radialGradient id="gRuby" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fecdd3" />
              <stop offset="40%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#4c0519" />
            </radialGradient>
          </defs>
          <path d="M12 25 L32 10 L50 2 L68 10 L88 25 L82 55 L50 82 L18 55 Z" fill="url(#gGold)" stroke="#fef08a" strokeWidth="2.5" />
          <path d="M50 8 L60 22 L50 28 L40 22 Z" fill="url(#gRuby)" stroke="#fff" strokeWidth="1" />
          <ellipse cx="36" cy="42" rx="7" ry="4.5" fill="#e11d48" stroke="#ffffff" strokeWidth="1.2" />
          <ellipse cx="64" cy="42" rx="7" ry="4.5" fill="#e11d48" stroke="#ffffff" strokeWidth="1.2" />
          <circle cx="36" cy="42" r="2.5" fill="#450a0a" />
          <circle cx="64" cy="42" r="2.5" fill="#450a0a" />
          <polygon points="50,42 42,62 58,62" fill="#fde047" stroke="#92400e" strokeWidth="2" />
          <path d="M38 70 Q50 78 62 70" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>

        <div className="w-full bg-gradient-to-r from-[#7f1d1d] via-[#dc2626] to-[#7f1d1d] border-t border-amber-300 py-0.5 text-center shadow z-10">
          <span className="font-display text-[9px] font-black tracking-widest text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] uppercase leading-none">
            WILD
          </span>
        </div>
      </div>
    );
  }

  if (id === "ruby" || id === "sapphire" || id === "emerald") {
    const isRuby = id === "ruby";
    const isSapphire = id === "sapphire";

    return (
      <div className="relative w-full h-full rounded-[4px] border-[2.5px] border-[#eab308] bg-gradient-to-b from-[#fef08a] via-[#ca8a04] to-[#451a03] p-[2px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.85),0_5px_10px_rgba(0,0,0,0.85)] flex items-center justify-center overflow-hidden">
        {/* Maya Carved Frame Texture */}
        <div className="relative size-[90%] rounded border-[2px] border-[#fbbf24] bg-gradient-to-b from-[#5c2303] via-[#381401] to-[#120500] p-1 flex items-center justify-center shadow-inner">
          <img
            src={asset.image}
            alt={id}
            className={`size-full object-cover rounded shadow-lg ${
              isRuby
                ? "hue-rotate-[320deg] saturate-200"
                : isSapphire
                ? "hue-rotate-[180deg] saturate-200"
                : "hue-rotate-[90deg] saturate-200"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20 pointer-events-none rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-[4px] border-[2.5px] border-[#92400e] bg-gradient-to-b from-[#d97706] via-[#78350f] to-[#291003] p-[2px] shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_5px_10px_rgba(0,0,0,0.8)] flex items-center justify-center">
      <span className="font-display text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-yellow-300 to-amber-600 drop-shadow-[0_3px_5px_rgba(0,0,0,1)] tracking-tighter">
        {asset.fallbackText}
      </span>
    </div>
  );
}

function JiliSpecialMedallion({ val }: { val: string | number }) {
  if (val === "WHEEL") {
    return (
      <div className="relative size-12 rounded-full border-[3px] border-yellow-300 bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-300 shadow-[0_0_15px_#facc15] flex items-center justify-center animate-spin">
        <Sparkles className="size-6 text-white" />
      </div>
    );
  }

  const num = Number(val);
  const colorGrad =
    num >= 15
      ? "from-[#f87171] via-[#dc2626] to-[#450a0a]"
      : num >= 10
      ? "from-[#c084fc] via-[#9333ea] to-[#3b0764]"
      : num >= 5
      ? "from-[#60a5fa] via-[#2563eb] to-[#0f172a]"
      : "from-[#34d399] via-[#059669] to-[#022c22]";

  return (
    <div className="relative size-12 flex items-center justify-center">
      {/* 3D Gold Rosette Medallion */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.95)]">
        <defs>
          <linearGradient id="pGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="40%" stopColor="#fbbf24" />
            <stop offset="85%" stopColor="#92400e" />
          </linearGradient>
        </defs>
        <polygon points="50,0 62,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 38,35" fill="url(#pGold)" stroke="#fef08a" strokeWidth="2.5" />
      </svg>

      <div className={`relative size-8 rounded-full border-[1.5px] border-yellow-200 bg-gradient-to-b ${colorGrad} shadow-inner flex items-center justify-center`}>
        <span className="font-display text-sm font-black text-yellow-100 drop-shadow-[0_2px_3px_rgba(0,0,0,1)] tracking-tighter">
          {num}x
        </span>
      </div>
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

  const [baseBet, setBaseBet] = useState<number>(3);
  const [extraBetMode, setExtraBetMode] = useState<boolean>(false);
  const [sound, setSound] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number>(0);

  const [celebration, setCelebration] = useState<{ tier: WinTier; amount: number; key: number } | null>(null);
  const [shake, setShake] = useState(false);
  const busy = useRef(false);

  const [grid, setGrid] = useState<string[][]>([
    ["garuda", "garuda", "garuda"],
    ["ruby", "ruby", "ruby"],
    ["sapphire", "sapphire", "sapphire"],
  ]);

  const [specialReel, setSpecialReel] = useState<(number | string)[]>([5, 10, 15]);

  const totalBet = extraBetMode ? Math.round(baseBet * 1.5) : baseBet;

  const getMultiplierPool = () => {
    return extraBetMode ? [2, 3, 5, 10, 15, "WHEEL"] : [1, 2, 3, 5, 10, 15, "WHEEL"];
  };

  const pickSymbol = () => {
    const rand = Math.random();
    if (rand < 0.12) return "garuda";
    if (rand < 0.28) return "ruby";
    if (rand < 0.48) return "sapphire";
    if (rand < 0.68) return "emerald";
    if (rand < 0.82) return "A";
    if (rand < 0.92) return "K";
    return "Q";
  };

  const handleBetChange = (delta: number) => {
    if (spinning) return;
    if (sound) playTempleSound("click");
    const bets = [1, 2, 3, 5, 10, 25, 50, 100];
    const currIdx = bets.indexOf(baseBet);
    let nextIdx = currIdx + delta;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= bets.length) nextIdx = bets.length - 1;
    setBaseBet(bets[nextIdx]);
  };

  const spin = () => {
    if (busy.current || spinning) return;
    if (!user || user.balance < totalBet) {
      toast.error("Insufficient balance! Please deposit to play.");
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

      if (cycles > 16) {
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
      className={`relative mx-auto max-w-sm overflow-hidden rounded-3xl border-4 border-[#854d0e] p-2.5 shadow-2xl font-sans select-none text-slate-100 ${
        shake ? "animate-win-shake" : ""
      }`}
      style={{
        background: "linear-gradient(180deg, #3d1b04 0%, #1a0a01 50%, #080300 100%)",
        boxShadow: "0 0 40px rgba(0,0,0,0.9), inset 0 0 20px rgba(180,83,9,0.3)",
      }}
    >
      <WinCelebration
        key={celebration?.key ?? "idle"}
        active={!!celebration}
        tier={celebration?.tier ?? "nice"}
        amount={celebration?.amount ?? 0}
        onDone={() => setCelebration(null)}
      />

      {/* Top Aztec Lucky Wheel & Shrine */}
      <div className="relative mb-2 overflow-hidden rounded-2xl border-2 border-[#ca8a04] bg-gradient-to-b from-[#5c2303] via-[#2d1101] to-[#120500] p-2 text-center shadow-lg">
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="font-display text-xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#fffbeb] via-[#facc15] to-[#ca8a04] drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
            FORTUNE GEMS 2
          </span>
        </div>

        <div className="relative mx-auto flex h-24 w-52 items-center justify-center overflow-hidden">
          <svg viewBox="0 0 200 100" className={`w-full h-full drop-shadow-[0_0_15px_#f59e0b] ${spinning ? "animate-spin" : ""}`}>
            <path d="M100 100 L0 100 A100 100 0 0 1 50 13 Z" fill="#0284c7" stroke="#fbbf24" strokeWidth="2.5" />
            <path d="M100 100 L50 13 A100 100 0 0 1 100 0 Z" fill="#16a34a" stroke="#fbbf24" strokeWidth="2.5" />
            <path d="M100 100 L100 0 A100 100 0 0 1 150 13 Z" fill="#ca8a04" stroke="#fbbf24" strokeWidth="2.5" />
            <path d="M100 100 L150 13 A100 100 0 0 1 200 100 Z" fill="#9333ea" stroke="#fbbf24" strokeWidth="2.5" />
            <text x="35" y="70" fill="#fef08a" fontSize="16" fontWeight="900" transform="rotate(-30 35 70)">150</text>
            <text x="75" y="45" fill="#fef08a" fontSize="16" fontWeight="900" transform="rotate(-10 75 45)">90</text>
            <text x="145" y="65" fill="#fef08a" fontSize="16" fontWeight="900" transform="rotate(35 145 65)">300</text>
          </svg>

          <div className="absolute top-0 z-20 flex size-10 items-center justify-center rounded-full border-2 border-yellow-200 bg-gradient-to-b from-yellow-300 via-amber-600 to-yellow-800 shadow-[0_0_10px_#f59e0b]">
            <Flame className="size-5 text-red-950 fill-red-600 animate-pulse" />
          </div>
          <div className="absolute top-8 z-20 size-0 border-x-4 border-x-transparent border-t-8 border-t-yellow-300 drop-shadow" />
        </div>

        {/* JILI EX Extra Bet Switch */}
        <div className="mt-1 flex items-center justify-between px-1">
          <div className="text-left">
            <span className="text-[9px] font-bold text-amber-300/90 uppercase block">Extra Bets (+50%)</span>
            <span className="text-[8px] text-amber-500 font-medium">Removes 1x Multiplier</span>
          </div>

          <button
            type="button"
            disabled={spinning}
            onClick={() => setExtraBetMode(!extraBetMode)}
            className={`flex items-center gap-1 rounded-full border-2 px-3 py-0.5 text-[10px] font-black tracking-wider transition-all active:scale-95 ${
              extraBetMode
                ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 border-yellow-200 text-slate-950 shadow-[0_0_15px_#f59e0b]"
                : "bg-[#271404] border-amber-800 text-amber-400"
            }`}
          >
            <span className="rounded bg-black/70 px-1 text-[8px] text-yellow-300">EX</span>
            <span>{extraBetMode ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* Carved Temple Slot Grid */}
      <div className="relative rounded-2xl border-4 border-[#b45309] bg-[#1a0a01] p-1.5 shadow-[inset_0_4px_10px_rgba(0,0,0,1)]">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-transparent via-amber-300 to-transparent pointer-events-none z-30 shadow-[0_0_18px_#f59e0b]" />

        <div className="grid grid-cols-4 gap-1">
          {[0, 1, 2].map((c) => (
            <div key={c} className="flex flex-col gap-1">
              {[0, 1, 2].map((r) => (
                <div
                  key={r}
                  className={`aspect-square w-full rounded-md transition-transform ${
                    r === 1 ? "scale-[1.03] z-10" : "opacity-90"
                  } ${spinning ? "blur-[0.5px]" : ""}`}
                >
                  <JiliSlotTile id={grid[c][r]} />
                </div>
              ))}
            </div>
          ))}

          {/* 4th Column: SPECIAL WHEEL Stack */}
          <div className="flex flex-col gap-1 rounded-md border-2 border-amber-600 bg-gradient-to-b from-[#3b1905] via-[#1c0c02] to-[#0d0400] p-0.5">
            <div className="bg-[#92400e] text-center text-[7px] font-black uppercase tracking-wider text-amber-200 py-0.5 rounded-sm">
              SPECIAL WHEEL
            </div>
            {[0, 1, 2].map((r) => (
              <div
                key={r}
                className={`relative flex aspect-square w-full items-center justify-center rounded border ${
                  r === 1
                    ? "border-yellow-300 bg-amber-500/25 shadow-[0_0_15px_#f59e0b] scale-[1.05] z-10"
                    : "border-amber-950/80 bg-black/50 opacity-80"
                }`}
              >
                {r === 1 && (
                  <div className="absolute inset-0 border-2 border-yellow-300 rounded pointer-events-none animate-pulse" />
                )}
                <JiliSpecialMedallion val={specialReel[r]} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* JILI Authentic Gold Console Deck */}
      <div className="mt-2 rounded-2xl border-2 border-[#b45309] bg-gradient-to-b from-[#3b1905] to-[#120601] p-2 shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-900/60 pb-1.5 px-2">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-xs font-black text-amber-400">WIN</span>
            <span className="font-mono text-sm font-black text-emerald-400">
              ₹{lastWin > 0 ? lastWin.toLocaleString("en-IN") : "0.00"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSound(!sound)}
              className="text-amber-400 hover:text-amber-200"
            >
              {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
            <span className="text-[11px] font-mono text-amber-300">
              Bal: <strong className="text-white">₹{user?.balance || 0}</strong>
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={spinning}
              onClick={() => handleBetChange(-1)}
              className="flex size-8 items-center justify-center rounded-full border border-amber-600 bg-[#241004] text-amber-200 active:scale-95 shadow"
            >
              <Minus className="size-4" />
            </button>

            <div className="rounded-xl border border-amber-600 bg-[#0f0501] px-3 py-1 text-center shadow-inner">
              <span className="block text-[8px] uppercase tracking-wider text-amber-400/80 font-bold">
                Bet
              </span>
              <span className="font-mono text-sm font-black text-white">₹{totalBet}</span>
            </div>

            <button
              type="button"
              disabled={spinning}
              onClick={() => handleBetChange(1)}
              className="flex size-8 items-center justify-center rounded-full border border-amber-600 bg-[#241004] text-amber-200 active:scale-95 shadow"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={spinning}
            onClick={spin}
            className={`relative flex size-16 items-center justify-center rounded-full border-4 border-[#fef08a] bg-gradient-to-b from-[#fde047] via-[#ca8a04] to-[#713f12] shadow-[0_0_25px_#f59e0b,inset_0_2px_5px_rgba(255,255,255,0.9)] active:scale-90 transition-transform ${
              spinning ? "opacity-80 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <span className="font-display text-[12px] font-black tracking-wider text-[#451a03] drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                SPIN
              </span>
              <span className="font-mono text-[8.5px] font-black text-red-950">
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
