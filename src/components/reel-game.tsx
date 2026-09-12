import React, { useState, useRef } from "react";
import { Volume2, VolumeX, Minus, Plus } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";

const BIG_WIN_VIDEO_URL =
  "https://drive.google.com/uc?export=download&id=1z1I2TtfhTbKRAJ6IiMQkqQfFfHa2a5Oq";

const playJiliSound = (type: "spin" | "stop" | "win" | "bigwin" | "click") => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "spin") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(240, ctx.currentTime);
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
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
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
        gain.gain.setValueAtTime(0.14, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.22);
      });
    } else if (type === "bigwin") {
      [392, 523, 659, 783, 1046, 1318].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.09);
        osc.stop(ctx.currentTime + i * 0.09 + 0.28);
      });
    }
  } catch {}
};

function GarudaMaskTile({ isHit }: { isHit?: boolean }) {
  return (
    <div
      className={`relative size-full rounded border-[2.5px] border-[#fde047] bg-gradient-to-b from-[#b45309] via-[#451a03] to-[#1a0801] p-0.5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_8px_rgba(0,0,0,0.9)] flex flex-col items-center justify-between overflow-hidden ${
        isHit ? "ring-2 ring-yellow-300 animate-pulse" : ""
      }`}
    >
      <div className="relative size-[84%] flex items-center justify-center">
        <svg viewBox="0 0 100 88" className="size-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]">
          <defs>
            <linearGradient id="g3dGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="55%" stopColor="#d97706" />
              <stop offset="85%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <radialGradient id="g3dRuby" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fee2e2" />
              <stop offset="40%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#450a0a" />
            </radialGradient>
          </defs>
          <path d="M12 25 L32 10 L50 2 L68 10 L88 25 L82 55 L50 82 L18 55 Z" fill="url(#g3dGold)" stroke="#fef08a" strokeWidth="1.8" />
          <path d="M50 7 L58 19 L50 25 L42 19 Z" fill="url(#g3dRuby)" stroke="#fff" strokeWidth="0.8" />
          <circle cx="34" cy="14" r="3.5" fill="url(#g3dRuby)" stroke="#fff" strokeWidth="0.6" />
          <circle cx="66" cy="14" r="3.5" fill="url(#g3dRuby)" stroke="#fff" strokeWidth="0.6" />
          <ellipse cx="36" cy="40" rx="7" ry="4.5" fill="url(#g3dRuby)" stroke="#ffffff" strokeWidth="1" />
          <ellipse cx="64" cy="40" rx="7" ry="4.5" fill="url(#g3dRuby)" stroke="#ffffff" strokeWidth="1" />
          <circle cx="36" cy="40" r="2.2" fill="#260801" />
          <circle cx="64" cy="40" r="2.2" fill="#260801" />
          <polygon points="50,40 42,60 58,60" fill="#fde047" stroke="#78350f" strokeWidth="1.8" />
          <path d="M38 68 Q50 76 62 68" stroke="#451a03" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      <div className="w-full bg-gradient-to-r from-[#7f1d1d] via-[#dc2626] to-[#7f1d1d] border-t border-amber-300 py-0.5 text-center shadow">
        <span className="font-display text-[9px] font-black tracking-widest text-amber-100 uppercase drop-shadow leading-none">
          WILD
        </span>
      </div>
    </div>
  );
}

function GemFacetTile({ type }: { type: "ruby" | "sapphire" | "emerald" }) {
  const isRuby = type === "ruby";
  const isSapph = type === "sapphire";

  const borderColor = isRuby ? "border-[#f43f5e]" : isSapph ? "border-[#60a5fa]" : "border-[#34d399]";
  const gemGrad = isRuby
    ? "from-[#ffe4e6] via-[#e11d48] to-[#4c0519]"
    : isSapph
    ? "from-[#dbeafe] via-[#2563eb] to-[#082f49]"
    : "from-[#d1fae5] via-[#059669] to-[#022c22]";

  return (
    <div className="relative size-full rounded border-[2.5px] border-[#ca8a04] bg-gradient-to-b from-[#fef08a] via-[#ca8a04] to-[#451a03] p-1 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_8px_rgba(0,0,0,0.85)] flex items-center justify-center">
      <div className="relative size-[88%] rounded border-2 border-[#fbbf24] bg-gradient-to-b from-[#5c2303] to-[#1a0801] p-1 flex items-center justify-center shadow-inner">
        <div
          className={`size-[84%] ${
            isRuby ? "rounded-full" : isSapph ? "rotate-45 rounded-[4px]" : "rounded-lg"
          } border-2 ${borderColor} bg-gradient-to-br ${gemGrad} shadow-[0_0_12px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.7)] flex items-center justify-center`}
        >
          <div className="size-[40%] bg-white/35 border border-white/70 rounded-sm" />
        </div>
      </div>
    </div>
  );
}

function StoneLetterTile({ char }: { char: string }) {
  return (
    <div className="relative size-full rounded border-2 border-[#78350f] bg-gradient-to-b from-[#5c2805] via-[#351502] to-[#1a0800] p-1 shadow-[inset_0_2px_3px_rgba(255,255,255,0.3),0_4px_8px_rgba(0,0,0,0.8)] flex items-center justify-center">
      <span className="font-display text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#92400e] drop-shadow-[0_3px_4px_rgba(0,0,0,1)]">
        {char}
      </span>
    </div>
  );
}

function SpecialLotusTile({ val }: { val: string | number }) {
  if (val === "WHEEL") {
    return (
      <div className="relative size-12 rounded-full border-[2.5px] border-yellow-300 bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-300 shadow-[0_0_15px_#facc15] flex flex-col items-center justify-center animate-pulse">
        <span className="font-display text-[8.5px] font-black tracking-widest text-amber-100 uppercase drop-shadow">
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

function AztecWheelDisk({ rotation }: { rotation: number }) {
  const segments = [
    { label: "20,000", color: "#9333ea" },
    { label: "200", color: "#16a34a" },
    { label: "20", color: "#dc2626" },
    { label: "600", color: "#0284c7" },
    { label: "100", color: "#78350f" },
    { label: "1,000", color: "#0284c7" },
    { label: "4,000", color: "#ea580c" },
    { label: "160", color: "#dc2626" },
    { label: "2,000", color: "#ca8a04" },
    { label: "60", color: "#dc2626" },
    { label: "400", color: "#ea580c" },
    { label: "300", color: "#16a34a" },
  ];

  return (
    <div
      className="relative size-56 rounded-full border-[6px] border-[#fbbf24] shadow-[0_0_25px_#f59e0b,inset_0_0_15px_rgba(0,0,0,0.8)] transition-transform duration-75 overflow-hidden flex items-center justify-center"
      style={{
        transform: `rotate(${rotation}deg)`,
        background:
          "conic-gradient(#9333ea 0deg 30deg, #16a34a 30deg 60deg, #dc2626 60deg 90deg, #0284c7 90deg 120deg, #78350f 120deg 150deg, #0284c7 150deg 180deg, #ea580c 180deg 210deg, #dc2626 210deg 240deg, #ca8a04 240deg 270deg, #dc2626 270deg 300deg, #ea580c 300deg 330deg, #16a34a 330deg 360deg)",
      }}
    >
      <div className="absolute inset-1.5 rounded-full border-2 border-yellow-200/60 pointer-events-none" />

      {segments.map((s, i) => {
        const angle = i * 30 + 15;
        return (
          <div
            key={i}
            className="absolute top-2 text-[8px] font-black text-yellow-100 font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,1)] tracking-tight origin-bottom h-26"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            {s.label}
          </div>
        );
      })}

      <div className="absolute size-14 rounded-full border-2 border-yellow-300 bg-gradient-to-b from-[#fde047] via-[#ca8a04] to-[#713f12] shadow-[0_0_15px_#f59e0b] flex items-center justify-center z-10">
        <div className="size-10 rounded-full bg-[#3f1905] border border-yellow-200 flex items-center justify-center">
          <span className="font-display text-[8px] font-black text-yellow-300">JILI</span>
        </div>
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
  const [showVideo, setShowVideo] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

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
    if (r < 0.18) return "garuda";
    if (r < 0.35) return "ruby";
    if (r < 0.52) return "sapphire";
    if (r < 0.70) return "emerald";
    if (r < 0.80) return "A";
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

    setShowVideo(false);
    setSpinning(true);
    addScore(-totalBet);
    setWinAmount(0);
    if (sound) playJiliSound("spin");

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

      if (sound && ticks % 2 === 0) playJiliSound("spin");

      if (ticks > 16) {
        clearInterval(interval);
        if (sound) playJiliSound("stop");

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

          // Trigger AI Video Animation Overlay
          setShowVideo(true);
          if (sound) playJiliSound(multiNum >= 10 ? "bigwin" : "win");

          if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => {});
          }

          toast.success(`🎉 Aztec Hit! +₹${payout} (${multiNum}x Multiplier)`);
        }
      }
    }, 70);
  };

  return (
    <div className="relative mx-auto max-w-[360px] overflow-hidden rounded-3xl border-4 border-[#854d0e] bg-[#0c0501] shadow-2xl font-sans select-none text-slate-100">
      
      {/* Top Bar */}
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

      {/* Main Game Screen */}
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

        {/* Wheel Shrine */}
        <div className="relative mx-auto flex h-34 w-64 items-center justify-center overflow-hidden">
          <div className="absolute -top-16">
            <AztecWheelDisk rotation={wheelAngle.current} />
          </div>
          <div className="absolute top-0 z-20 size-0 border-x-6 border-x-transparent border-t-10 border-t-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
        </div>

        {/* Reels Grid */}
        <div className="relative rounded-2xl border-4 border-[#b45309] bg-[#1a0a01] p-1.5 shadow-[inset_0_4px_12px_rgba(0,0,0,1)]">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-transparent via-amber-300 to-transparent pointer-events-none z-30 shadow-[0_0_18px_#f59e0b]" />

          <div className="grid grid-cols-4 gap-1">
            {[0, 1, 2].map((colIdx) => (
              <div key={colIdx} className="flex flex-col gap-1">
                {[0, 1, 2].map((rowIdx) => {
                  const item = grid[colIdx][rowIdx];
                  const isCenter = rowIdx === 1;

                  return (
                    <div
                      key={rowIdx}
                      className={`aspect-square w-full rounded transition-all ${
                        isCenter ? "scale-[1.02] z-10" : "opacity-90"
                      } ${spinning ? "blur-[0.5px]" : ""}`}
                    >
                      {item === "garuda" && <GarudaMaskTile isHit={isCenter && showVideo} />}
                      {item === "ruby" && <GemFacetTile type="ruby" />}
                      {item === "sapphire" && <GemFacetTile type="sapphire" />}
                      {item === "emerald" && <GemFacetTile type="emerald" />}
                      {["A", "K", "Q", "J"].includes(item) && <StoneLetterTile char={item} />}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Special Tower */}
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
                  <SpecialLotusTile val={specialCol[r]} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Video Animation Layer */}
        {showVideo && (
          <div
            onClick={() => setShowVideo(false)}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer animate-in fade-in duration-300"
          >
            <video
              ref={videoRef}
              src={BIG_WIN_VIDEO_URL}
              playsInline
              autoPlay
              onEnded={() => setShowVideo(false)}
              className="w-full max-h-[75%] object-contain drop-shadow-[0_0_25px_#f59e0b]"
            />
            <div className="mt-2 text-center">
              <h3 className="font-display text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-amber-600 drop-shadow">
                AZTEC HIT!
              </h3>
              <span className="font-mono text-2xl font-black text-emerald-400 block mt-0.5">
                +₹{winAmount.toLocaleString("en-IN")}
              </span>
              <span className="text-[9px] text-amber-300/80 font-bold uppercase tracking-wider block mt-1">
                Tap anywhere to skip
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Console Bottom */}
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
