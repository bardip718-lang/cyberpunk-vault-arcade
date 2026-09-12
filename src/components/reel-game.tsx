import React, { useState, useRef } from "react";
import { Volume2, VolumeX, Minus, Plus } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";

// High-speed CDN proxy for Google Drive Video (Bypasses CORS & Direct Stream)
const PROXY_VIDEO_URL = "https://lh3.googleusercontent.com/d/1z1I2TtfhTbKRAJ6IiMQkqQfFfHa2a5Oq";

const REEL_SYMBOLS = [
  "garuda", "ruby", "A", "sapphire", "K", "emerald", "Q", "J",
  "garuda", "ruby", "sapphire", "emerald", "A", "K", "Q", "J",
  "garuda", "ruby", "sapphire", "emerald"
];

const SPECIAL_SYMBOLS = [1, 2, 3, 5, 10, 15, "WHEEL", 2, 5, 10, 15];

export function ReelGame() {
  const { user, addScore } = useVault();

  const [bet, setBet] = useState(30);
  const [extraBet, setExtraBet] = useState(false);
  const [sound, setSound] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [showWinOverlay, setShowWinOverlay] = useState(false);

  const [stopped, setStopped] = useState<[boolean, boolean, boolean, boolean]>([true, true, true, true]);
  const [finalIndices, setFinalIndices] = useState<[number, number, number, number]>([0, 1, 2, 3]);

  const totalBet = extraBet ? Math.round(bet * 1.5) : bet;
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const spin = () => {
    if (isSpinning) return;
    if (!user || user.balance < totalBet) {
      toast.error("Insufficient balance!");
      return;
    }

    addScore(-totalBet);
    setIsSpinning(true);
    setShowWinOverlay(false);
    setWinAmount(0);

    setStopped([false, false, false, false]);

    // 22% authentic hit rate
    const willHit = Math.random() < 0.22;
    let r0: number, r1: number, r2: number, r3: number;

    if (willHit) {
      const matchSym = Math.random() < 0.3 ? "garuda" : "ruby";
      const targetIndices = REEL_SYMBOLS.map((s, i) => (s === matchSym ? i : -1)).filter((i) => i >= 1 && i <= 15);
      r0 = targetIndices[0] ?? 1;
      r1 = targetIndices[1] ?? targetIndices[0] ?? 1;
      r2 = targetIndices[0] ?? 1;
      r3 = Math.floor(Math.random() * (SPECIAL_SYMBOLS.length - 2)) + 1;
    } else {
      r0 = Math.floor(Math.random() * 12) + 1;
      r1 = (r0 + 3) % 14 + 1;
      r2 = (r0 + 7) % 14 + 1;
      r3 = Math.floor(Math.random() * (SPECIAL_SYMBOLS.length - 2)) + 1;
    }

    setFinalIndices([r0, r1, r2, r3]);

    setTimeout(() => setStopped(([_, b, c, d]) => [true, b, c, d]), 700);
    setTimeout(() => setStopped(([a, _, c, d]) => [a, true, c, d]), 1050);
    setTimeout(() => setStopped(([a, b, _, d]) => [a, b, true, d]), 1400);

    setTimeout(() => {
      setStopped([true, true, true, true]);
      setIsSpinning(false);

      if (willHit) {
        const multi = Number(SPECIAL_SYMBOLS[r3]) || 2;
        const payout = Math.round(bet * 4 * multi);
        addScore(payout);
        setWinAmount(payout);
        setShowWinOverlay(true);

        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
        toast.success(`🎉 AZTEC WIN! +₹${payout}`);
      }
    }, 1800);
  };

  return (
    <div className="relative mx-auto max-w-[360px] overflow-hidden rounded-3xl border-4 border-[#854d0e] bg-[#0c0501] shadow-2xl font-sans select-none text-slate-100">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-900/60 bg-[#140802] px-3 py-1.5 z-20">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setSound(!sound)} className="text-amber-400 hover:text-amber-200">
            {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
            JILI Fortune Gems 2
          </span>
        </div>

        <button
          type="button"
          disabled={isSpinning}
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

      {/* Main Shrine & Rolling Strip */}
      <div className="relative px-3 pt-3 pb-2 bg-gradient-to-b from-[#381604] via-[#1a0b02] to-[#0a0300]">
        
        <div className="text-center mb-2">
          <h2 className="font-display text-xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#fffbeb] via-[#facc15] to-[#b45309] drop-shadow">
            FORTUNE GEMS 2
          </h2>
        </div>

        {/* 3x3 Reel Matrix + 4th Tower */}
        <div className="relative h-[225px] overflow-hidden rounded-2xl border-4 border-[#b45309] bg-[#120601] p-1 shadow-[inset_0_4px_16px_rgba(0,0,0,1)]">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-transparent via-amber-300 to-transparent pointer-events-none z-30 shadow-[0_0_18px_#f59e0b]" />

          <div className="grid grid-cols-4 gap-1 h-full">
            {[0, 1, 2].map((colIdx) => {
              const isLocked = stopped[colIdx];
              const targetIdx = finalIndices[colIdx];
              const targetTranslateY = -(targetIdx * 72);

              return (
                <div key={colIdx} className="relative h-full overflow-hidden rounded bg-[#1f0a02]">
                  <div
                    className="w-full flex flex-col will-change-transform"
                    style={{
                      transform: isLocked ? `translate3d(0, ${targetTranslateY}px, 0)` : `translate3d(0, -900px, 0)`,
                      transition: isLocked
                        ? "transform 0.45s cubic-bezier(0.15, 0.9, 0.25, 1.2)"
                        : "none",
                      animation: !isLocked ? "reelRollLoop 0.28s linear infinite" : "none",
                    }}
                  >
                    {REEL_SYMBOLS.map((sym, idx) => (
                      <div key={idx} className="h-[72px] w-full p-0.5 flex items-center justify-center shrink-0">
                        {sym === "garuda" && (
                          <div className="size-full rounded border-2 border-yellow-300 bg-gradient-to-b from-[#d97706] to-[#451a03] p-0.5 flex flex-col items-center justify-between shadow">
                            <span className="text-xl mt-1">🦅</span>
                            <span className="bg-red-700 text-white font-black text-[8px] w-full text-center rounded-xs">WILD</span>
                          </div>
                        )}
                        {sym === "ruby" && (
                          <div className="size-full rounded border border-amber-600 bg-black/40 p-1 flex items-center justify-center">
                            <div className="size-10 rounded-full bg-gradient-to-br from-rose-400 via-rose-600 to-rose-950 border border-rose-300 shadow" />
                          </div>
                        )}
                        {sym === "sapphire" && (
                          <div className="size-full rounded border border-amber-600 bg-black/40 p-1 flex items-center justify-center">
                            <div className="size-9 rotate-45 rounded-sm bg-gradient-to-br from-blue-400 via-blue-600 to-blue-950 border border-blue-300 shadow" />
                          </div>
                        )}
                        {sym === "emerald" && (
                          <div className="size-full rounded border border-amber-600 bg-black/40 p-1 flex items-center justify-center">
                            <div className="size-9 rounded-md bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-950 border border-emerald-300 shadow" />
                          </div>
                        )}
                        {["A", "K", "Q", "J"].includes(sym) && (
                          <div className="size-full rounded border border-amber-900/60 bg-[#160601] flex items-center justify-center">
                            <span className="font-display text-2xl font-black text-amber-400 drop-shadow">{sym}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Special Tower */}
            <div className="relative h-full overflow-hidden rounded bg-[#2b1003] border border-amber-700">
              <div
                className="w-full flex flex-col will-change-transform"
                style={{
                  transform: stopped[3] ? `translate3d(0, ${-(finalIndices[3] * 72)}px, 0)` : `translate3d(0, -600px, 0)`,
                  transition: stopped[3]
                    ? "transform 0.5s cubic-bezier(0.15, 0.9, 0.25, 1.25)"
                    : "none",
                  animation: !stopped[3] ? "reelRollLoop 0.24s linear infinite" : "none",
                }}
              >
                {SPECIAL_SYMBOLS.map((val, idx) => (
                  <div key={idx} className="h-[72px] w-full p-0.5 flex items-center justify-center shrink-0">
                    <div className="size-11 rounded-full border-2 border-yellow-300 bg-gradient-to-b from-amber-500 to-red-900 flex items-center justify-center shadow-[0_0_10px_#f59e0b]">
                      <span className="font-display text-xs font-black text-white">
                        {val === "WHEEL" ? "WHEEL" : `${val}x`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Video Animation Overlay (Proxy Stream + Fallback UI) */}
        {showWinOverlay && (
          <div
            onClick={() => setShowWinOverlay(false)}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer animate-in fade-in duration-200"
          >
            <video
              ref={videoRef}
              src={PROXY_VIDEO_URL}
              playsInline
              autoPlay
              onEnded={() => setShowWinOverlay(false)}
              className="w-full max-h-[70%] object-contain drop-shadow-[0_0_30px_#f59e0b]"
            />
            <div className="text-center mt-2">
              <h3 className="font-display text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-400 to-amber-600 drop-shadow">
                AZTEC BIG WIN!
              </h3>
              <span className="font-mono text-2xl font-black text-emerald-400 block mt-0.5">
                +₹{winAmount.toLocaleString("en-IN")}
              </span>
              <span className="text-[9px] text-amber-300 font-bold uppercase tracking-wider block mt-1">
                Tap anywhere to skip
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Controls */}
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
              disabled={isSpinning}
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
              disabled={isSpinning}
              onClick={() => setBet((b) => b + 10)}
              className="flex size-8 items-center justify-center rounded-full border border-amber-600 bg-[#241004] text-amber-200 active:scale-95 shadow"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={isSpinning}
            onClick={spin}
            className={`relative flex size-16 items-center justify-center rounded-full border-4 border-[#fef08a] bg-gradient-to-b from-[#fde047] via-[#ca8a04] to-[#713f12] shadow-[0_0_25px_#f59e0b] active:scale-90 transition-transform ${
              isSpinning ? "opacity-80 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <span className="font-display text-[12px] font-black tracking-wider text-[#451a03]">
                SPIN
              </span>
              <span className="font-mono text-[8.5px] font-black text-red-950">
                ₹{totalBet}
              </span>
            </div>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes reelRollLoop {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(0, -576px, 0); }
        }
      `}</style>
    </div>
  );
}

export default ReelGame;
                                                                                          
