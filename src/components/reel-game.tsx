import React, { useState, useRef } from "react";
import { Volume2, VolumeX, Minus, Plus } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";

// High-fidelity audio synthesizer
const playSound = (type: "spin" | "stop" | "win" | "bigwin" | "click") => {
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
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.25);
      });
    } else if (type === "bigwin") {
      [392, 523, 659, 783, 1046, 1318].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.09);
        osc.stop(ctx.currentTime + i * 0.09 + 0.3);
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

// Original Assets with Clean Cutouts
const ASSETS = {
  garudaMask: "https://lh3.googleusercontent.com/d/1XGpMpbTDGO66ioEcuOKXziD4IFJ6KjnK",
  garudaMurthi: "https://lh3.googleusercontent.com/d/1q20VnS9FqB7jS5_XbQW_placeholder", // Fallback animation model
  lightningOrb: "https://lh3.googleusercontent.com/d/1mx_1l_KWn8Zw3AcICrLMWtGLyblnJiV5",
};

// Garuda Mask Component with SVG Mask (White background removal)
function OriginalGarudaMask({ isHit }: { isHit?: boolean }) {
  return (
    <div
      className={`relative size-full rounded-md border-2 border-[#fde047] bg-gradient-to-b from-[#ca8a04] via-[#78350f] to-[#290c01] p-0.5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_4px_8px_rgba(0,0,0,0.9)] flex flex-col items-center justify-between overflow-hidden ${
        isHit ? "animate-pulse ring-4 ring-yellow-400" : ""
      }`}
    >
      <div className="relative size-[86%] flex items-center justify-center">
        {/* Render High-Poly Garuda Mask with Multiplied White BG */}
        <svg viewBox="0 0 100 95" className="size-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
          <defs>
            <linearGradient id="goldRelief" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="85%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <radialGradient id="rubyGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffe4e6" />
              <stop offset="40%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#4c0519" />
            </radialGradient>
          </defs>
          {/* Wings & Horns */}
          <path d="M10 25 Q30 5 50 2 Q70 5 90 25 Q82 55 50 85 Q18 55 10 25 Z" fill="url(#goldRelief)" stroke="#fef08a" strokeWidth="2.5" />
          {/* Triple Ruby Crown */}
          <path d="M50 4 L58 18 L50 24 L42 18 Z" fill="url(#rubyGlow)" stroke="#fff" strokeWidth="1" />
          <path d="M34 10 L42 20 L30 22 Z" fill="url(#rubyGlow)" stroke="#fff" strokeWidth="0.8" />
          <path d="M66 10 L58 20 L70 22 Z" fill="url(#rubyGlow)" stroke="#fff" strokeWidth="0.8" />
          {/* Angry Eyes */}
          <ellipse cx="36" cy="42" rx="7.5" ry="5" fill="url(#rubyGlow)" stroke="#fff" strokeWidth="1.2" />
          <ellipse cx="64" cy="42" rx="7.5" ry="5" fill="url(#rubyGlow)" stroke="#fff" strokeWidth="1.2" />
          <circle cx="36" cy="42" r="2.5" fill="#290c01" />
          <circle cx="64" cy="42" r="2.5" fill="#290c01" />
          {/* Sharp Beak */}
          <polygon points="50,42 42,62 58,62" fill="#fde047" stroke="#78350f" strokeWidth="2" />
          <path d="M38 72 Q50 80 62 72" stroke="#451a03" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      <div className="w-full bg-gradient-to-r from-[#7f1d1d] via-[#dc2626] to-[#7f1d1d] border-t border-amber-300 py-0.5 text-center shadow">
        <span className="font-display text-[9px] font-black tracking-widest text-amber-100 uppercase drop-shadow">
          WILD
        </span>
      </div>
    </div>
  );
}

// 3D Gem Tile Component
function GemTile({ type }: { type: "ruby" | "sapphire" | "emerald" }) {
  const isRuby = type === "ruby";
  const isSapph = type === "sapphire";

  const borderColor = isRuby ? "border-[#f43f5e]" : isSapph ? "border-[#60a5fa]" : "border-[#34d399]";
  const gemGrad = isRuby
    ? "from-[#ffe4e6] via-[#e11d48] to-[#4c0519]"
    : isSapph
    ? "from-[#dbeafe] via-[#2563eb] to-[#082f49]"
    : "from-[#d1fae5] via-[#059669] to-[#022c22]";

  return (
    <div className="relative size-full rounded-md border-2 border-[#ca8a04] bg-gradient-to-b from-[#fef08a] via-[#a16207] to-[#2e1003] p-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),0_4px_8px_rgba(0,0,0,0.8)] flex items-center justify-center">
      <div className="relative size-[86%] rounded border-2 border-[#fbbf24] bg-gradient-to-b from-[#5c2303] to-[#1a0801] p-1 flex items-center justify-center shadow-inner">
        <div
          className={`size-[84%] ${
            isRuby ? "rounded-full" : isSapph ? "rotate-45 rounded-[4px]" : "rounded-lg"
          } border-2 ${borderColor} bg-gradient-to-br ${gemGrad} shadow-[0_0_12px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.7)] flex items-center justify-center`}
        >
          <div className="size-[40%] bg-white/30 border border-white/60 rounded-sm" />
        </div>
      </div>
    </div>
  );
}

function LetterTile({ char }: { char: string }) {
  return (
    <div className="relative size-full rounded-md border-2 border-[#78350f] bg-gradient-to-b from-[#5c2805] via-[#351502] to-[#120500] p-1 shadow-[inset_0_2px_3px_rgba(255,255,255,0.3),0_4px_8px_rgba(0,0,0,0.8)] flex items-center justify-center">
      <span className="font-display text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#92400e] drop-shadow-[0_3px_4px_rgba(0,0,0,1)]">
        {char}
      </span>
    </div>
  );
}

function SpecialMedallion({ val }: { val: string | number }) {
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

  // Win Presentation State
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [showGarudaWarrior, setShowGarudaWarrior] = useState(false);

  const [grid, setGrid] = useState<string[][]>([
    ["garuda", "garuda", "garuda"],
    ["ruby", "ruby", "ruby"],
    ["sapphire", "sapphire", "sapphire"],
  ]);

  const [specialCol, setSpecialCol] = useState<(string | number)[]>([5, 10, 15]);

  const wheelAngle = useRef(0);
  const totalBet = extraBet ? Math.round(bet * 1.5) : bet;

  const pickRandom = () => {
    const r = Math.random();
    if (r < 0.15) return "garuda";
    if (r < 0.32) return "ruby";
    if (r < 0.5) return "sapphire";
    if (r < 0.68) return "emerald";
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

    // Dismiss any stuck popup immediately
    setShowWinPopup(false);
    setShowGarudaWarrior(false);

    setSpinning(true);
    addScore(-totalBet);
    setWinAmount(0);
    if (sound) playSound("spin");

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

      if (sound && ticks % 2 === 0) playSound("spin");

      if (ticks > 16) {
        clearInterval(interval);
        if (sound) playSound("stop");

        // Land
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

        // Center row evaluation
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

          // Trigger Garuda Murthi Fly Animation & Lightning
          setShowGarudaWarrior(true);
          setShowWinPopup(true);

          if (multiNum >= 10 || payout >= bet * 10) {
            if (sound) playSound("bigwin");
          } else {
            if (sound) playSound("win");
          }

          // Auto-hide popup after 1.4s so it never gets stuck
          setTimeout(() => {
            setShowWinPopup(false);
            setShowGarudaWarrior(false);
          }, 1400);

          toast.success(`🎉 Aztec Hit! +₹${payout} (${multiNum}x)`);
        }
      }
    }, 70);
  };

  return (
    <div className="relative mx-auto max-w-[360px] overflow-hidden rounded-3xl border-4 border-[#854d0e] bg-[#0c0501] shadow-2xl font-sans select-none text-slate-100">
      
      {/* 1win Header Top Bar */}
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

      {/* Main Temple Environment */}
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

        {/* 360° Circular Aztec Lucky Wheel */}
        <div className="relative mx-auto flex h-36 w-64 items-center justify-center overflow-hidden">
          <div
            className="absolute -top-14 size-56 rounded-full border-4 border-[#facc15] shadow-[0_0_20px_#f59e0b] transition-transform duration-75"
            style={{
              transform: `rotate(${wheelAngle.current}deg)`,
              background:
                "conic-gradient(#dc2626 0deg 36deg, #ea580c 36deg 72deg, #ca8a04 72deg 108deg, #16a34a 108deg 144deg, #0284c7 144deg 180deg, #9333ea 180deg 216deg, #dc2626 216deg 252deg, #ca8a04 252deg 288deg, #16a34a 288deg 324deg, #0284c7 324deg 360deg)",
            }}
          >
            {/* Spinning Lightning Core */}
            <div className="absolute inset-0 m-auto size-16 rounded-full border-2 border-yellow-200 bg-gradient-to-tr from-yellow-400 via-amber-600 to-yellow-200 shadow-[0_0_15px_#facc15] flex items-center justify-center">
              <span className="font-mono text-[9px] font-black text-red-950">20,000</span>
            </div>
          </div>

          <div className="absolute top-0 z-20 size-0 border-x-6 border-x-transparent border-t-10 border-t-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
        </div>

        {/* Aztec Stone Slot Grid */}
        <div className="relative rounded-2xl border-4 border-[#b45309] bg-[#1a0a01] p-1.5 shadow-[inset_0_4px_12px_rgba(0,0,0,1)]">
          {/* Center Payline Laser */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-transparent via-amber-300 to-transparent pointer-events-none z-30 shadow-[0_0_18px_#f59e0b]" />

          <div className="grid grid-cols-4 gap-1">
            {/* 3 Main Slot Columns */}
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
                      {item === "garuda" && <OriginalGarudaMask isHit={isCenter && showWinPopup} />}
                      {item === "ruby" && <GemTile type="ruby" />}
                      {item === "sapphire" && <GemTile type="sapphire" />}
                      {item === "emerald" && <GemTile type="emerald" />}
                      {["A", "K", "Q", "J"].includes(item) && <LetterTile char={item} />}
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
                  <SpecialMedallion val={specialCol[r]} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3D Garuda Warrior & Lightning Animation on Win */}
        {showGarudaWarrior && (
          <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
            {/* Spinning Lightning Aura Orb */}
            <div className="absolute size-48 rounded-full bg-[radial-gradient(circle,_rgba(250,204,21,0.8)_0%,_transparent_70%)] animate-ping" />
            {/* 3D Golden Warrior Flying In */}
            <svg
              viewBox="0 0 100 100"
              className="size-40 z-10 drop-shadow-[0_0_25px_#facc15] animate-in zoom-in-50 spin-in-180 duration-500"
            >
              <defs>
                <linearGradient id="warriorGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fffbeb" />
                  <stop offset="30%" stopColor="#fde047" />
                  <stop offset="70%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>
              </defs>
              {/* Spreading Golden Wings & Warrior Silhouette */}
              <path
                d="M50 15 Q75 0 95 25 Q70 45 50 65 Q30 45 5 25 Q25 0 50 15 Z"
                fill="url(#warriorGold)"
                stroke="#fff"
                strokeWidth="2"
              />
              <circle cx="50" cy="35" r="14" fill="#facc15" stroke="#78350f" strokeWidth="2" />
              <polygon points="50,32 44,48 56,48" fill="#fff" />
            </svg>
          </div>
        )}

        {/* Transient Quick Win Overlay (Auto Dismisses in 1.4s or on Tap) */}
        {showWinPopup && (
          <div
            onClick={() => {
              setShowWinPopup(false);
              setShowGarudaWarrior(false);
            }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] cursor-pointer animate-in fade-in zoom-in-90 duration-200"
          >
            <div className="rounded-2xl border-2 border-yellow-400 bg-gradient-to-b from-[#451a03] to-[#1a0801] p-4 text-center shadow-[0_0_30px_#f59e0b]">
              <h3 className="font-display text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-amber-600 drop-shadow">
                AZTEC HIT!
              </h3>
              <span className="font-mono text-3xl font-black text-emerald-400 block mt-1 drop-shadow">
                +₹{winAmount.toLocaleString("en-IN")}
              </span>
              <span className="text-[9px] text-amber-300/80 uppercase font-bold tracking-wider mt-1 block">
                Tap anywhere to continue
              </span>
            </div>
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
