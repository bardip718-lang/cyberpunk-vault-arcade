import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Plus, Minus } from "lucide-react";

type SymbolType =
  | "wild"
  | "ruby"
  | "emerald"
  | "sapphire"
  | "A"
  | "K";

const TILE = 76;

const REEL_1: SymbolType[] = [
  "ruby","A","wild","emerald","K","ruby",
  "sapphire","wild","A","emerald","ruby"
];

const REEL_2: SymbolType[] = [
  "emerald","ruby","K","wild","sapphire",
  "ruby","A","wild","emerald","ruby","K"
];

const REEL_3: SymbolType[] = [
  "wild","ruby","emerald","A","sapphire",
  "K","ruby","wild","emerald","A","ruby"
];

const MULTI = [2,3,5,10,15,"WHEEL",5,10,15];

const BG =
  "https://images.unsplash.com/photo-1544731612-de7f96afe55f?q=80&w=1200&auto=format&fit=crop";

const GarudaWild = ({ glow=false }:{ glow?:boolean }) => (
  <div className={`relative w-full h-full rounded-xl overflow-hidden border-2 ${
      glow ? "border-yellow-300 shadow-[0_0_20px_#FACC15]" : "border-amber-700"
    }`}>
    <img
      src="/assets/garuda-wild.png"
      className="absolute inset-0 w-full h-full object-cover"
    />
    <div className="absolute bottom-0 w-full py-1 bg-gradient-to-r from-red-800 via-red-600 to-red-800 text-center text-[10px] font-black tracking-[0.3em]">
      WILD
    </div>
  </div>
);

const Gem = ({ type }:{ type:"ruby"|"emerald"|"sapphire" }) => {
  const src =
    type==="ruby"
      ? "/assets/ruby.png"
      : type==="emerald"
      ? "/assets/emerald.png"
      : "/assets/sapphire.png";

  return (
    <div className="w-full h-full rounded-xl border border-yellow-700 bg-[#3A1B07] p-1">
      <img src={src} className="w-full h-full object-contain" />
    </div>
  );
};
/* ---------- PART 2 : TEMPLE + WHEEL ---------- */

const Wheel = ({ deg }: { deg: number }) => (
  <div
    className="relative w-56 h-56 rounded-full border-[7px] border-yellow-400 overflow-hidden shadow-[0_0_30px_#F59E0B]"
    style={{
      transform: `rotate(${deg}deg)`,
      transition: "transform 2.8s cubic-bezier(.15,1,.2,1)",
      background:
        "conic-gradient(#7C3AED 0 30deg,#2563EB 30 60deg,#16A34A 60 90deg,#EA580C 90 120deg,#DC2626 120 150deg,#CA8A04 150 180deg,#0EA5E9 180 210deg,#92400E 210 240deg,#2563EB 240 270deg,#DC2626 270 300deg,#EA580C 300 330deg,#16A34A 330 360deg)",
    }}
  >
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-700 border-4 border-yellow-100 flex items-center justify-center font-black text-black">
        JILI
      </div>
    </div>

    <div className="absolute left-1/2 -translate-x-1/2 top-0 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px] border-transparent border-b-yellow-300"/>
  </div>
);

/* ---------- PLAYER STATE ---------- */

const [balance, setBalance] = useState(2000);
const [bet, setBet] = useState(30);
const [win, setWin] = useState(0);
const [sound, setSound] = useState(true);
const [extraBet, setExtraBet] = useState(false);

const [spinning, setSpinning] = useState(false);
const [wheelDeg, setWheelDeg] = useState(0);

const totalBet = extraBet ? Math.round(bet * 1.5) : bet;

/* ---------- REEL POSITION ---------- */

const [r1, setR1] = useState(2);
const [r2, setR2] = useState(2);
const [r3, setR3] = useState(2);
const [r4, setR4] = useState(3);

/* ---------- WILD VIDEO ---------- */

const videoRef = useRef<HTMLVideoElement>(null);

const playWildVideo = () => {
  if (!videoRef.current) return;
  videoRef.current.currentTime = 0;
  videoRef.current.play().catch(() => {});
};
/* ---------- PART 3 : SPIN ENGINE ---------- */

const getMid = (strip: SymbolType[], stop: number) => strip[stop];

const isWild = (s: SymbolType) => s === "wild";

const calculateWin = (
  a: SymbolType,
  b: SymbolType,
  c: SymbolType,
  multi: number
) => {
  const match =
    (a === b && b === c) ||
    (isWild(a) && b === c) ||
    (isWild(b) && a === c) ||
    (isWild(c) && a === b);

  if (!match) return 0;

  return totalBet * 4 * multi;
};

const spin = () => {
  if (spinning || balance < totalBet) return;

  setSpinning(true);
  setWin(0);
  setBalance((b) => b - totalBet);

  setWheelDeg((d) => d + 1440 + Math.floor(Math.random() * 360));

  const hit = Math.random() < 0.32;

  let s1 = 2, s2 = 2, s3 = 2, s4 = 3;

  if (hit) {
    const sym: SymbolType =
      Math.random() < 0.4 ? "wild" : "ruby";

    s1 = REEL_1.findIndex((x) => x === sym || x === "wild");
    s2 = REEL_2.findIndex((x) => x === sym || x === "wild");
    s3 = REEL_3.findIndex((x) => x === sym || x === "wild");

    s4 = Math.floor(Math.random() * 5) + 2;
  } else {
    s1 = Math.floor(Math.random() * 7) + 1;
    s2 = Math.floor(Math.random() * 7) + 1;
    s3 = Math.floor(Math.random() * 7) + 1;
    s4 = Math.floor(Math.random() * 5) + 2;
  }

  setTimeout(() => setR1(s1), 600);
  setTimeout(() => setR2(s2), 900);
  setTimeout(() => setR3(s3), 1200);
  setTimeout(() => setR4(s4), 1500);

  setTimeout(() => {
    const A = getMid(REEL_1, s1);
    const B = getMid(REEL_2, s2);
    const C = getMid(REEL_3, s3);

    const mul =
      typeof MULTI[s4] === "number"
        ? (MULTI[s4] as number)
        : 2;

    const payout = calculateWin(A, B, C, mul);

    if (A === "wild" || B === "wild" || C === "wild") {
      playWildVideo();
    }

    if (payout > 0) {
      setWin(payout);
      setBalance((b) => b + payout);
    }

    setSpinning(false);
  }, 1800);
};
/* ---------- PART 4 : FX + SOUND ---------- */

const audioRef = useRef<AudioContext | null>(null);

const [flash, setFlash] = useState(false);
const [shake, setShake] = useState(false);

const playSound = (type: "spin" | "stop" | "win") => {
  if (!sound) return;

  if (!audioRef.current) {
    audioRef.current = new AudioContext();
  }

  const ctx = audioRef.current;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === "spin") {
    osc.type = "triangle";
    osc.frequency.value = 240;
  }

  if (type === "stop") {
    osc.type = "sine";
    osc.frequency.value = 160;
  }

  if (type === "win") {
    osc.type = "square";
    osc.frequency.value = 880;

    setFlash(true);
    setShake(true);

    setTimeout(() => setFlash(false), 250);
    setTimeout(() => setShake(false), 400);
  }

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + 0.18
  );

  osc.start();
  osc.stop(ctx.currentTime + 0.18);
};

useEffect(() => {
  if (spinning) playSound("spin");
}, [spinning]);

useEffect(() => {
  if (win > 0) playSound("win");
}, [win]);

/* ---------- PARTICLES ---------- */

const GoldParticles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {Array.from({ length: 24 }).map((_, i) => (
      <div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-yellow-300 animate-ping"
        style={{
          left: `${(i * 23) % 100}%`,
          top: `${(i * 17) % 100}%`,
          animationDelay: `${i * 0.05}s`,
        }}
      />
    ))}
  </div>
);

/* ---------- CSS ---------- */

const ReelCSS = () => (
  <style>{`
    @keyframes reelSpin{
      0%{transform:translateY(0)}
      100%{transform:translateY(-456px)}
    }

    @keyframes screenShake{
      0%,100%{transform:translateX(0)}
      25%{transform:translateX(-4px)}
      50%{transform:translateX(4px)}
      75%{transform:translateX(-3px)}
    }
  `}</style>
);
/* ---------- PART 5 : TEMPLE UI ---------- */

return (
  <div
    className={`relative mx-auto max-w-[360px] overflow-hidden rounded-3xl border-4 border-amber-700 bg-[#140802] text-white ${
      shake ? "animate-[screenShake_.35s]" : ""
    }`}
  >
    <ReelCSS />

    {flash && <GoldParticles />}

    <img
      src={BG}
      className="absolute inset-0 h-full w-full object-cover opacity-25"
    />

    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-[#1A0C02]/70 to-[#140802]" />

    <div className="relative z-10">
      {/* Header */}

      <div className="flex items-center justify-between border-b border-amber-700 bg-[#2B1406]/90 px-3 py-2">
        <div>
          <div className="text-[9px] font-bold tracking-[0.35em] text-yellow-300">
            JILI GAMES
          </div>

          <h1 className="text-lg font-black italic text-yellow-100">
            FORTUNE GEMS 2
          </h1>
        </div>

        <button
          onClick={() => setSound(!sound)}
          className="rounded-full border border-yellow-500 bg-[#3A1B08] p-2"
        >
          {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      {/* Wheel */}

      <div className="relative flex justify-center py-3">
        <Wheel deg={wheelDeg} />
      </div>

      {/* Reel Area */}

      <div className="mx-2 rounded-2xl border-2 border-amber-600 bg-[#241003]/90 p-2 shadow-[inset_0_0_18px_rgba(0,0,0,.8)]">
        <div className="grid grid-cols-4 gap-1">
          {/* Reel 1 */}

          <div className="space-y-1">
            {[
              REEL_1[r1 - 1],
              REEL_1[r1],
              REEL_1[r1 + 1],
            ].map((s, i) => (
              <div
                key={i}
                className="h-[76px] overflow-hidden rounded-xl border border-yellow-700 bg-[#3A1B08]"
              >
                {s === "wild" ? (
                  <GarudaWild glow={win > 0} />
                ) : s === "ruby" ? (
                  <Gem type="ruby" />
                ) : s === "emerald" ? (
                  <Gem type="emerald" />
                ) : s === "sapphire" ? (
                  <Gem type="sapphire" />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl font-black text-yellow-300">
                    {s}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Reel 2 */}

          <div className="space-y-1">
            {[
              REEL_2[r2 - 1],
              REEL_2[r2],
              REEL_2[r2 + 1],
            ].map((s, i) => (
              <div
                key={i}
                className="h-[76px] overflow-hidden rounded-xl border border-yellow-700 bg-[#3A1B08]"
              >
                {s === "wild" ? (
                  <GarudaWild glow={win > 0} />
                ) : s === "ruby" ? (
                  <Gem type="ruby" />
                ) : s === "emerald" ? (
                  <Gem type="emerald" />
                ) : s === "sapphire" ? (
                  <Gem type="sapphire" />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl font-black text-yellow-300">
                    {s}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Reel 3 */}

          <div className="space-y-1">
            {[
              REEL_3[r3 - 1],
              REEL_3[r3],
              REEL_3[r3 + 1],
            ].map((s, i) => (
              <div
                key={i}
                className="h-[76px] overflow-hidden rounded-xl border border-yellow-700 bg-[#3A1B08]"
              >
                {s === "wild" ? (
                  <GarudaWild glow={win > 0} />
                ) : s === "ruby" ? (
                  <Gem type="ruby" />
                ) : s === "emerald" ? (
                  <Gem type="emerald" />
                ) : s === "sapphire" ? (
                  <Gem type="sapphire" />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl font-black text-yellow-300">
                    {s}
                  </div>
                )}
              </div>
            ))}
          </div>
			          {/* Special Multiplier */}
          <div className="space-y-1">
            {[MULTI[r4 - 1], MULTI[r4], MULTI[r4 + 1]].map((m, i) => (
              <div
                key={i}
                className="h-[76px] rounded-xl border border-yellow-500 bg-gradient-to-b from-[#4B1F08] to-[#241003] flex items-center justify-center"
              >
                {m === "WHEEL" ? (
                  <span className="text-[11px] font-black text-yellow-300">
                    WHEEL
                  </span>
                ) : (
                  <span className="text-xl font-black text-white">{m}×</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wild Animation */}
      <video
        ref={videoRef}
        src="/assets/garuda-win.mp4"
        className="hidden"
        muted
        playsInline
      />

      {/* Win Panel */}
      <div className="px-3 pt-3 text-center">
        <div className="text-[10px] font-bold tracking-[0.3em] text-yellow-300">
          BIG WIN
        </div>

        <div className="text-3xl font-black text-emerald-400">
          ₹{win}
        </div>

        <div className="mt-1 text-[11px] text-yellow-100">
          Balance ₹{balance}
        </div>
      </div>

      {/* Controls */}
      <div className="p-3">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setBet(Math.max(10, bet - 10))}
            className="h-10 w-10 rounded-full border border-yellow-600 bg-[#3A1B08] flex items-center justify-center"
          >
            <Minus size={18} />
          </button>

          <div className="text-center">
            <div className="text-[9px] text-yellow-300">TOTAL BET</div>
            <div className="text-xl font-black">₹{totalBet}</div>
          </div>

          <button
            onClick={() => setBet(bet + 10)}
            className="h-10 w-10 rounded-full border border-yellow-600 bg-[#3A1B08] flex items-center justify-center"
          >
            <Plus size={18} />
          </button>
        </div>

        <button
          disabled={spinning}
          onClick={spin}
          className="w-full rounded-2xl bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-800 py-4 text-xl font-black text-black shadow-[0_0_25px_#F59E0B]"
        >
          {spinning ? "SPINNING..." : "SPIN"}
        </button>
      </div>
    </div>
  </div>
);

export default ReelGame;
