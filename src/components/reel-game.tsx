import React, { useState, useRef } from "react";
import { Volume2, VolumeX, Minus, Plus } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";
import { WinCelebration, tierFor, type WinTier } from "@/components/win-celebration";

// Audio Synthesizer for JILI Spin, Reel Clicks & Win Fanfare
const playSlotSound = (type: "spin" | "stop" | "win" | "bigwin" | "click") => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "spin") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "stop") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
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
      [392, 523, 659, 783, 1046, 1318].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
        gain.gain.setValueAtTime(0.16, ctx.currentTime + i * 0.09);
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
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    }
  } catch {}
};

// Google Drive Direct Image URLs
const ASSETS = {
  wheel: "https://lh3.googleusercontent.com/d/1mx_1l_KWn8Zw3AcICrLMWtGLyblnJiV5",
  garuda: "https://lh3.googleusercontent.com/d/1XGpMpbTDGO66ioEcuOKXziD4IFJ6KjnK",
  ruby: "https://lh3.googleusercontent.com/d/1qsYLkopcFjWB_gyqxvLqK3WHmajmu2M7",
  sapphire: "https://lh3.googleusercontent.com/d/1g6XF0X-vRPklmMrAaFx2Krc2qinxHFpX",
  emerald: "https://lh3.googleusercontent.com/d/1di5dq7zOIdhZoYnMjQzaP-S_m08czqxP",
};

function RealSlotTile({ id }: { id: string }) {
  if (id === "garuda") {
    return (
      <div className="relative size-full rounded-md border-2 border-[#facc15] bg-gradient-to-b from-[#ca8a04] via-[#78350f] to-[#290c01] p-0.5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_8px_rgba(0,0,0,0.9)] flex flex-col items-center justify-between overflow-hidden">
        <img
          src={ASSETS.garuda}
          alt="Garuda Wild"
          className="size-full object-contain mix-blend-screen contrast-125 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
        <div className="absolute bottom-0 w-full bg-gradient-to-r from-[#991b1b] via-[#ef4444] to-[#991b1b] border-t border-amber-300 py-0.5 text-center shadow">
          <span className="font-display text-[8.5px] font-black tracking-widest text-amber-100 uppercase">
            WILD
          </span>
        </div>
      </div>
    );
  }

  if (id === "ruby" || id === "sapphire" || id === "emerald") {
    const src = id === "ruby" ? ASSETS.ruby : id === "sapphire" ? ASSETS.sapphire : ASSETS.emerald;
    return (
      <div className="relative size-full rounded-md border-2 border-[#ca8a04] bg-gradient-to-b from-[#fef08a] via-[#a16207] to-[#2e1003] p-0.5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),0_4px_8px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
        <img
          src={src}
          alt={id}
          className="size-[92%] object-contain mix-blend-screen contrast-125 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative size-full rounded-md border-2 border-[#78350f] bg-gradient-to-b from-[#5c2805] via-[#351502] to-[#120500] p-1 shadow-[inset_0_2px_3px_rgba(255,255,255,0.3),0_4px_8px_rgba(0,0,0,0.8)] flex items-center justify-center">
      <span className="font-display text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#92400e] drop-shadow-[0_3px_4px_rgba(0,0,0,1)]">
        {id}
      </span>
    </div>
  );
}

function RealMultiplierMedallion({ val }: { val: string | number }) {
  if (val === "WHEEL") {
    return (
      <div className="relative size-11 rounded-full border-2 border-yellow-300 bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-300 shadow-[0_0_12px_#facc15] flex flex-col items-center justify-center animate-pulse">
        <span className="font-display text-[8px] font-black tracking-widest text-amber-100 uppercase drop-shadow">
          WHEEL
        </span>
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
    <div className="relative size-11 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full drop-shadow-[0_3px_5px_rgba(0,0,0,0.9)]">
        <polygon
          points="50,0 62,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 38,35"
          fill="#fbbf24"
          stroke="#fef08a"
          strokeWidth="3"
        />
      </svg>
      <div
        className={`relative size-7 rounded-full border-[1.5px] border-yellow-200 bg-gradient-to-b ${colorGrad} shadow-inner flex items-center justify-center`}
      >
        <span className="font-display text-[12px] font-black text-yellow-100 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] tracking-tighter">
          {num}x
        </span>
      </div>
    </div>
  );
}

export function ReelGame() {
  const { user, addScore } = useVault();

  const [bet, setBet] = useState(30);
  const [extraBet, setExtraBet] = useState(false);
  const [sound, setSound] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [bigWinActive, setBigWinActive] = useState(false);

  const [celebration, setCelebration] = useState<{ tier: WinTier; amount: number; key: number } | null>(null);

  // 3x3 Grid
  const [grid, setGrid] = useState<string[][]>([
    ["garuda", "garuda", "garuda"],
    ["ruby", "ruby", "ruby"],
    ["sapphire", "sapphire", "sapphire"],
  ]);

  // 4th Special Reel
  const [specialCol, setSpecialCol] = useState<(string | number)[]>([5, 10, 15]);

  const wheelAngle = useRef(0);
  const totalBet = extraBet ? Math.round(bet * 1.5) : bet;

  const pickRandom = () => {
    const r = Math.random();
    if (r < 0.14) return "garuda";
    if (r < 0.3) return "ruby";
    if (r < 0.48) return "sapphire";
    if (r < 0.66) return "emerald";
    if (r < 0.78) return "A";
    if (r < 0.88) return "K";
    if (r < 0.94) return "Q";
    return "J";
  };

  const spin = () => {
    if (spinning) return;
    if (!user || user.balance < totalBet) {
      toast.error("Insufficient balance! Please deposit to play.");
      return;
    }

    setSpinning(true);
    addScore(-totalBet);
    setWinAmount(0);
    setBigWinActive(false);
    setCelebration(null);
    if (sound) playSlotSound("spin");

    const multiPool = extraBet ? [2, 3, 5, 10, 15, "WHEEL"] : [1, 2, 3, 5, 10, 15, "WHEEL"];
    let ticks = 0;

    const interval = setInterval(() => {
      ticks++;
      wheelAngle.current += 24;

      setGrid([
        [pickRandom(), pickRandom(), pickRandom()],
        [pickRandom(), pickRandom(), pickRandom()],
        [pickRandom(), pickRandom(), pickRandom()],
      ]);

      setSpecialCol([
        multiPool[Math.floor(Math.random() * multiPool.length)],
        multiPool[Math.floor(Math.random() * multiPool.length)],
        multiPool[Math.floor(Math.random() * multiPool.length)],
      ]);

      if (sound && ticks % 2 === 0) playSlotSound("spin");

      if (ticks > 16) {
        clearInterval(interval);
        if (sound) playSlotSound("stop");

        const finalGrid = [
          [pickRandom(), pickRandom(), pickRandom()],
          [pickRandom(), pickRandom(), pickRandom()],
          [pickRandom(), pickRandom(), pickRandom()],
        ];

        const finalSpecial = [
          multiPool[Math.floor(Math.random() * multiPool.length)],
          multiPool[Math.floor(Math.random() * multiPool.length)],
          multiPool[Math.floor(Math.random() * multiPool.length)],
        ];

        setGrid(finalGrid);
        setSpecialCol(finalSpecial);
        setSpinning(false);

        // Evaluate Center Row
        const centerMulti = finalSpecial[1];
        const c0 = finalGrid[0][1];
        const c1 = finalGrid[1][1];
        const c2 = finalGrid[2][1];

        const isMatch =
          (c0 === c1 || c0 === "garuda" || c1 === "garuda") &&
          (c1 === c2 || c1 === "garuda" || c2 === "garuda");

        if (isMatch) {
          const multiNum = typeof centerMulti === "number" ? centerMulti : 20;
          const payout = Math.round(bet * 4 * multiNum);

          addScore(payout);
          setWinAmount(payout);

          const tier = tierFor(multiNum);
          setCelebration({ tier, amount: payout, key: Date.now() });

          if (multiNum >= 10 || payout >= bet * 10) {
            setBigWinActive(true);
            if (sound) playSlotSound("bigwin");
          } else {
            if (sound) playSlotSound("win");
          }

          toast.success(`🎉 Aztec Hit! +₹${payout} (${multiNum}x Multiplier)`);
        }
      }
    }, 70);
  };

  return (
    <div className="relative mx-auto max-w-[360px] overflow-hidden rounded-3xl border-4 border-[#854d0e] bg-[#0c0501] shadow-2xl font-sans select-none text-slate-100">
      
      <WinCelebration
        key={celebration?.key ?? "idle"}
        active={!!celebration}
        tier={celebration?.tier ?? "nice"}
        amount={celebration?.amount ?? 0}
        onDone={() => setCelebration(null)}
      />

      {/* 1win Header Controls */}
      <div className="flex items-center justify-between border-b border-amber-900/60 bg-[#140802] px-3 py-1.5 z-20">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSound(!sound)}
            className="text-amber-400 hover:text-amber-200"
          >
            {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
            JILI Games
          </span>
        </div>

        <button
          type="button"
          disabled={spinning}
          onClick={() => setExtraBet(!extraBet)}
          className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9.5px] font-black tracking-wider transition-all ${
            extraBet
              ? "bg-gradient-to-r from-yellow-400 to-amber-600 border-yellow-200 text-slate-950 shadow-[0_0_12px_#f59e0b]"
              : "bg-[#240e02] border-amber-800 text-amber-300"
          }`}
        >
          <span className="rounded bg-black/60 px-1 text-[8px] text-yellow-300">EX</span>
          <span>{extraBet ? "ON" : "OFF"}</span>
        </button>
      </div>

      {/* Main Aztec Temple Shrine Container */}
      <div
        className="relative px-2 pt-2 pb-1"
        style={{
          background: "linear-gradient(180deg, #421c05 0%, #1f0b01 40%, #0d0400 100%)",
        }}
      >
        <div className="text-center mb-1">
          <h2 className="font-display text-xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#fffbeb] via-[#facc15] to-[#b45309] drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
            FORTUNE GEMS 2
          </h2>
        </div>

        {/* Real Aztec Lucky Wheel from Drive Asset */}
        <div className="relative mx-auto flex h-36 w-64 items-center justify-center overflow-hidden">
          <img
            src={ASSETS.wheel}
            alt="Fortune Wheel"
            className="absolute -top-12 size-60 object-contain mix-blend-screen contrast-125 drop-shadow-[0_0_20px_#f59e0b] transition-transform duration-75"
            style={{ transform: `rotate(${wheelAngle.current}deg)` }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          {/* Wheel Pointer Pin */}
          <div className="absolute top-0 z-20 size-0 border-x-6 border-x-transparent border-t-10 border-t-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
        </div>

        {/* Slot Grid Frame */}
        <div className="relative rounded-2xl border-4 border-[#b45309] bg-[#1a0a01] p-1.5 shadow-[inset_0_4px_12px_rgba(0,0,0,1)]">
          {/* Center Line Laser Glow */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-transparent via-amber-300 to-transparent pointer-events-none z-30 shadow-[0_0_18px_#f59e0b]" />

          <div className="grid grid-cols-4 gap-1">
            {/* 3 Main Slot Columns with Real Drive PNGs */}
            {[0, 1, 2].map((colIdx) => (
              <div key={colIdx} className="flex flex-col gap-1">
                {[0, 1, 2].map((rowIdx) => {
                  const item = grid[colIdx][rowIdx];
                  const isCenter = rowIdx === 1;

                  return (
                    <div
                      key={rowIdx}
                      className={`aspect-square w-full rounded-md transition-all ${
                        isCenter ? "scale-[1.02] z-10" : "opacity-90"
                      } ${spinning ? "blur-[0.5px]" : ""}`}
                    >
                      <RealSlotTile id={item} />
                    </div>
                  );
                })}
              </div>
            ))}

            {/* 4th Column: SPECIAL WHEEL Tower */}
            <div className="flex flex-col gap-1 rounded-md border-2 border-amber-600 bg-gradient-to-b from-[#3b1905] via-[#1c0c02] to-[#0d0400] p-0.5">
              <div className="bg-[#92400e] text-center text-[7px] font-black uppercase tracking-wider text-amber-200 py-0.5 rounded-sm">
                SPECIAL
              </div>
              {[0, 1, 2].map((r) => (
                <div
                  key={r}
                  className={`relative flex aspect-square w-full items-center justify-center rounded border ${
                    r === 1
                      ? "border-yellow-300 bg-amber-500/25 shadow-[0_0_15px_#f59e0b] scale-[1.04] z-10"
                      : "border-amber-950/80 bg-black/50 opacity-80"
                  }`}
                >
                  {r === 1 && (
                    <div className="absolute inset-0 border-2 border-yellow-300 rounded pointer-events-none animate-pulse" />
                  )}
                  <RealMultiplierMedallion val={specialCol[r]} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Big Win Pop Overlay */}
        {bigWinActive && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in zoom-in-95">
            <h3 className="font-display text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-amber-600 drop-shadow-[0_4px_12px_#f59e0b] animate-bounce">
              BIG WIN!
            </h3>
            <span className="font-mono text-3xl font-black text-white mt-1 drop-shadow">
              ₹{winAmount.toLocaleString("en-IN")}
            </span>
            <button
              onClick={() => setBigWinActive(false)}
              className="mt-3 rounded-full bg-emerald-600 px-5 py-1 text-xs font-bold text-white shadow-lg active:scale-95"
            >
              Collect
            </button>
          </div>
        )}
      </div>

      {/* JILI Authentic Console Deck */}
      <div className="border-t-2 border-[#b45309] bg-gradient-to-b from-[#2a1204] to-[#0d0400] p-2.5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-900/60 pb-1.5 px-2">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-xs font-black text-amber-400">WIN</span>
            <span className="font-mono text-sm font-black text-emerald-400">
              ₹{winAmount > 0 ? winAmount.toLocaleString("en-IN") : "0.00"}
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-300 font-bold">
            Balance: <strong className="text-white">₹{user?.balance || 0}</strong>
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={spinning}
              onClick={() => setBet((b) => Math.max(10, b - 10))}
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
              onClick={() => setBet((b) => b + 10)}
              className="flex size-8 items-center justify-center rounded-full border border-amber-600 bg-[#241004] text-amber-200 active:scale-95 shadow"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={spinning}
            onClick={spin}
            className={`relative flex size-16 items-center justify-center rounded-full border-4 border-[#fef08a] bg-gradient-to-b from-[#fde047] bg-gradient-to-b from-[#fde047] via-[#ca8a04] to-[#713f12] shadow-[0_0_25px_#f59e0b,inset_0_2px_5px_rgba(255,255,255,0.9)] active:scale-90 transition-transform ${
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
