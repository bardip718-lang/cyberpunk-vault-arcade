import React, { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Minus, Plus, Sparkles } from "lucide-react";

type SymbolType = "wild" | "ruby" | "emerald" | "sapphire" | "A" | "K";

const REEL_1: SymbolType[] = [
  "ruby", "A", "wild", "emerald", "K", "ruby",
  "sapphire", "wild", "A", "emerald", "ruby",
];
const REEL_2: SymbolType[] = [
  "emerald", "ruby", "K", "wild", "sapphire",
  "ruby", "A", "wild", "emerald", "ruby", "K",
];
const REEL_3: SymbolType[] = [
  "wild", "ruby", "emerald", "A", "sapphire",
  "K", "ruby", "wild", "emerald", "A", "ruby",
];

const MULTI: (number | "WHEEL")[] = [2, 3, 5, 10, 15, "WHEEL", 5, 10, 15];

const BG = "/assets/temple-bg.jpg";

/* ---------- SYMBOL TILES ---------- */

const GarudaWild = ({ glow = false }: { glow?: boolean }) => (
  <div
    className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 bg-gradient-to-b from-[#3A1B08] to-[#1A0C02] ${
      glow
        ? "border-yellow-300 shadow-[0_0_22px_#FACC15]"
        : "border-amber-700/80"
    }`}
  >
    <img
      src="/assets/garuda-wild.png"
      alt="Garuda WILD symbol"
      loading="lazy"
      width={1024}
      height={1024}
      className={`h-[80%] w-[80%] object-contain drop-shadow-[0_0_10px_rgba(250,204,21,0.7)] ${
        glow ? "animate-pulse" : ""
      }`}
    />
    <div className="absolute bottom-0 w-full bg-gradient-to-r from-red-900 via-red-600 to-red-900 py-0.5 text-center text-[9px] font-black tracking-[0.3em] text-yellow-100">
      WILD
    </div>
  </div>
);

const GEM_SRC: Record<"ruby" | "emerald" | "sapphire", string> = {
  ruby: "/assets/ruby.png",
  emerald: "/assets/emerald.png",
  sapphire: "/assets/sapphire.png",
};

const Gem = ({ type }: { type: "ruby" | "emerald" | "sapphire" }) => (
  <div className="flex h-full w-full items-center justify-center rounded-xl border border-yellow-700/70 bg-gradient-to-b from-[#3A1B07] to-[#1A0C02] p-1.5">
    <img
      src={GEM_SRC[type]}
      alt={`${type} gem symbol`}
      loading="lazy"
      width={1024}
      height={1024}
      className="h-full w-full object-contain drop-shadow-[0_0_8px_rgba(250,204,21,0.35)]"
    />
  </div>
);

function SymbolTile({ s, glow }: { s: SymbolType; glow: boolean }) {
  if (s === "wild") return <GarudaWild glow={glow} />;
  if (s === "ruby" || s === "emerald" || s === "sapphire")
    return <Gem type={s} />;
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-yellow-700/70 bg-gradient-to-b from-[#3A1B08] to-[#1A0C02] text-3xl font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
      {s}
    </div>
  );
}

/* ---------- BONUS WHEEL ---------- */

const Wheel = ({ deg }: { deg: number }) => (
  <div
    aria-hidden
    className="relative h-40 w-40 overflow-hidden rounded-full border-[6px] border-yellow-400 shadow-[0_0_30px_#F59E0B] sm:h-48 sm:w-48"
    style={{
      transform: `rotate(${deg}deg)`,
      transition: "transform 2.8s cubic-bezier(.15,1,.2,1)",
      background:
        "conic-gradient(#7C3AED 0 30deg,#2563EB 30deg 60deg,#16A34A 60deg 90deg,#EA580C 90deg 120deg,#DC2626 120deg 150deg,#CA8A04 150deg 180deg,#0EA5E9 180deg 210deg,#92400E 210deg 240deg,#2563EB 240deg 270deg,#DC2626 270deg 300deg,#EA580C 300deg 330deg,#16A34A 330deg 360deg)",
    }}
  >
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-yellow-100 bg-gradient-to-b from-yellow-300 to-yellow-700 text-xs font-black text-black">
        BONUS
      </div>
    </div>
    <div className="absolute left-1/2 top-0 w-0 h-0 -translate-x-1/2 border-l-[8px] border-r-[8px] border-b-[16px] border-transparent border-b-yellow-300" />
  </div>
);

/* ---------- GAME ---------- */

export function ReelGame() {
  // Demo/virtual coins only — not connected to the real wallet.
  const [balance, setBalance] = useState(2000);
  const [bet, setBet] = useState(30);
  const [win, setWin] = useState(0);
  const [sound, setSound] = useState(true);
  const [extraBet, setExtraBet] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [wheelDeg, setWheelDeg] = useState(0);
  const [flash, setFlash] = useState(false);
  const [shake, setShake] = useState(false);

  const [r1, setR1] = useState(2);
  const [r2, setR2] = useState(2);
  const [r3, setR3] = useState(2);
  const [r4, setR4] = useState(3);

  const totalBet = extraBet ? Math.round(bet * 1.5) : bet;
  const audioRef = useRef<AudioContext | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  };

  const getMid = (strip: SymbolType[], stop: number): SymbolType =>
    strip[stop] ?? "ruby";

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

  const playSound = (type: "spin" | "stop" | "win") => {
    if (!sound) return;
    try {
      audioRef.current ??= new AudioContext();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === "spin") {
        osc.type = "triangle";
        osc.frequency.value = 240;
      } else if (type === "stop") {
        osc.type = "sine";
        osc.frequency.value = 160;
      } else {
        osc.type = "square";
        osc.frequency.value = 880;
        setFlash(true);
        setShake(true);
        later(() => setFlash(false), 350);
        later(() => setShake(false), 450);
      }
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // audio unavailable
    }
  };

  const spin = () => {
    if (spinning || balance < totalBet) return;

    setSpinning(true);
    setWin(0);
    setBalance((b) => b - totalBet);
    setWheelDeg((d) => d + 1440 + Math.floor(Math.random() * 360));
    playSound("spin");

    const hit = Math.random() < 0.32;
    let s1 = 2, s2 = 2, s3 = 2, s4 = 3;

    if (hit) {
      const sym: SymbolType = Math.random() < 0.4 ? "wild" : "ruby";
      s1 = Math.max(1, REEL_1.findIndex((x) => x === sym || x === "wild"));
      s2 = Math.max(1, REEL_2.findIndex((x) => x === sym || x === "wild"));
      s3 = Math.max(1, REEL_3.findIndex((x) => x === sym || x === "wild"));
      s4 = Math.floor(Math.random() * 5) + 2;
    } else {
      s1 = Math.floor(Math.random() * 7) + 1;
      s2 = Math.floor(Math.random() * 7) + 1;
      s3 = Math.floor(Math.random() * 7) + 1;
      s4 = Math.floor(Math.random() * 5) + 2;
    }

    // Staggered reel stops
    later(() => {
      setR1(s1);
      playSound("stop");
    }, 600);
    later(() => {
      setR2(s2);
      playSound("stop");
    }, 950);
    later(() => {
      setR3(s3);
      playSound("stop");
    }, 1300);
    later(() => setR4(s4), 1600);

    later(() => {
      const A = getMid(REEL_1, s1);
      const B = getMid(REEL_2, s2);
      const C = getMid(REEL_3, s3);
      const m = MULTI[s4];
      const mul = typeof m === "number" ? m : 2;
      const payout = calculateWin(A, B, C, mul);

      if (payout > 0) {
        setWin(payout);
        setBalance((b) => b + payout);
        playSound("win");
      }
      setSpinning(false);
    }, 1900);
  };

  const reels: { strip: SymbolType[]; pos: number }[] = [
    { strip: REEL_1, pos: r1 },
    { strip: REEL_2, pos: r2 },
    { strip: REEL_3, pos: r3 },
  ];

  return (
    <div
      className={`relative mx-auto w-full max-w-[400px] select-none overflow-hidden rounded-3xl border-4 border-amber-700 bg-[#140802] text-white shadow-2xl ${
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
      `}</style>

      {/* Temple backdrop */}
      <img
        src={BG}
        alt=""
        aria-hidden
        width={768}
        height={1344}
        className="absolute inset-0 h-full w-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#1A0C02]/70 to-[#140802]" />

      {/* Win particles */}
      {flash && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-2 w-2 rounded-full bg-yellow-300"
              style={{
                left: `${(i * 53) % 100}%`,
                animation: `coinFall ${1 + (i % 4) * 0.3}s ease-in ${i * 0.06}s forwards`,
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
            <h1 className="text-lg font-black italic text-yellow-100">
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

        {/* Bonus wheel */}
        <div className="relative flex justify-center py-3">
          <Wheel deg={wheelDeg} />
        </div>

        {/* Reel frame */}
        <div className="mx-2 rounded-2xl border-2 border-amber-500/80 bg-[#241003]/90 p-2 shadow-[inset_0_0_18px_rgba(0,0,0,.8),0_0_24px_rgba(245,158,11,0.25)]">
          {/* Center payline marker */}
          <div className="pointer-events-none absolute left-3 right-3 top-1/2 z-20 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent" />
          <div className="grid grid-cols-4 gap-1.5">
            {reels.map(({ strip, pos }, col) => (
              <div key={col} className="space-y-1.5">
                {[strip[pos - 1], strip[pos], strip[pos + 1]].map((s, i) => (
                  <div
                    key={i}
                    className={`h-[72px] overflow-hidden rounded-xl transition-all sm:h-[80px] ${
                      i === 1
                        ? "ring-2 ring-yellow-400/70 shadow-[0_0_12px_rgba(250,204,21,0.35)]"
                        : "opacity-70"
                    } ${spinning ? "blur-[1px]" : ""}`}
                  >
                    <SymbolTile s={s ?? "ruby"} glow={win > 0 && i === 1} />
                  </div>
                ))}
              </div>
            ))}

            {/* Multiplier reel */}
            <div className="space-y-1.5 rounded-xl border border-amber-500/50 bg-gradient-to-b from-amber-950/40 to-[#1A0C02] p-1">
              <div className="py-0.5 text-center text-[8px] font-black uppercase tracking-widest text-yellow-300">
                Multi
              </div>
              {[MULTI[r4 - 1], MULTI[r4], MULTI[r4 + 1]].map((m, i) => (
                <div
                  key={i}
                  className={`flex h-[58px] items-center justify-center rounded-lg border sm:h-[64px] ${
                    i === 1
                      ? "border-yellow-400 bg-yellow-500/20 shadow-[0_0_14px_rgba(250,204,21,0.5)]"
                      : "border-amber-900/60 bg-[#140802] opacity-60"
                  } ${spinning ? "blur-[1px]" : ""}`}
                >
                  {m === "WHEEL" ? (
                    <span className="flex flex-col items-center text-[9px] font-black text-yellow-300">
                      <Sparkles className="size-3" />
                      WHEEL
                    </span>
                  ) : (
                    <span
                      className={`font-black ${
                        i === 1 ? "text-xl text-yellow-200" : "text-base text-white/70"
                      }`}
                    >
                      {m}×
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Win panel */}
        <div className="px-3 pt-3 text-center" aria-live="polite">
          {win > 0 ? (
            <>
              <div className="text-[10px] font-bold tracking-[0.3em] text-yellow-300">
                {win >= totalBet * 40 ? "JACKPOT" : win >= totalBet * 16 ? "BIG WIN" : "NICE WIN"}
              </div>
              <div className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]">
                +{win} coins
              </div>
            </>
          ) : (
            <div className="text-[11px] text-yellow-100/70">
              Match 3 symbols on the glowing centre line
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
              <div className="text-xl font-black">{totalBet} coins</div>
              <button
                type="button"
                onClick={() => setExtraBet(!extraBet)}
                disabled={spinning}
                aria-pressed={extraBet}
                className={`mt-1 rounded-lg border px-2 py-0.5 text-[10px] font-black transition-all ${
                  extraBet
                    ? "border-yellow-400 bg-yellow-500 text-black"
                    : "border-amber-800 bg-[#1A0C02] text-yellow-300"
                }`}
              >
                EX {extraBet ? "ON (+50%)" : "OFF"}
              </button>
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
            disabled={spinning || balance < totalBet}
            onClick={spin}
            className="w-full rounded-2xl bg-gradient-to-b from-yellow-300 via-amber-500 to-amber-800 py-4 text-xl font-black tracking-widest text-black shadow-[0_0_25px_#F59E0B] transition-all active:scale-95 disabled:opacity-50"
          >
            {spinning ? "SPINNING…" : balance < totalBet ? "OUT OF COINS" : "SPIN"}
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
