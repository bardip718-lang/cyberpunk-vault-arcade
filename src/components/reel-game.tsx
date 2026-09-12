import React, { useState, useRef } from "react";
import { Volume2, VolumeX, Minus, Plus } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";
// Direct High-Speed Cloud Asset CDN (Zero Local Upload Required)
const ASSETS = {
WILD: "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=600&q=80",
GEMS: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
WHEEL: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80",
};
// Inline Authentic 3D Rendered Garuda Mask Tile
function GarudaMaskTile({ isHit }: { isHit?: boolean }) {
return (
<div
className={`relative size-full rounded-xl border-[2.5px] border-[#fbbf24] bg-gradient-to-b from-[#b45309] via-[#451a03] to-[#1a0801] p-1
shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),0_4px_10px_rgba(0,0,0,0.9)] flex flex-col items-center justify-between overflow-hidden ${
isHit ? "ring-4 ring-yellow-300 animate-pulse scale-105" : ""
}`}
>
<div className="relative size-[78%] flex items-center justify-center mt-0.5">
<svg viewBox="0 0 100 88" className="size-full drop-shadow-[0_4px_10px_rgba(0,0,0,1)]">
<defs>
<linearGradient id="goldFeather" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stopColor="#fffbeb" />
<stop offset="25%" stopColor="#fde047" />
<stop offset="60%" stopColor="#d97706" />
<stop offset="90%" stopColor="#78350f" />
<stop offset="100%" stopColor="#451a03" />
</linearGradient>
<radialGradient id="rubyGlow" cx="50%" cy="50%" r="50%">
<stop offset="0%" stopColor="#fee2e2" />
<stop offset="35%" stopColor="#ef4444" />
<stop offset="100%" stopColor="#7f1d1d" />
</radialGradient>
</defs>
<path d="M12 25 L32 10 L50 2 L68 10 L88 25 L82 55 L50 82 L18 55 Z" fill="url(#goldFeather)" stroke="#fef08a" strokeWidth="2" />
<ellipse cx="36" cy="38" rx="6" ry="4" fill="url(#rubyGlow)" stroke="#fff" strokeWidth="0.8" />
<ellipse cx="64" cy="38" rx="6" ry="4" fill="url(#rubyGlow)" stroke="#fff" strokeWidth="0.8" />
<circle cx="36" cy="38" r="2" fill="#200501" />
<circle cx="64" cy="38" r="2" fill="#200501" />
<polygon points="50,42 42,60 58,60" fill="#fde047" stroke="#78350f" strokeWidth="1.8" />
</svg>
</div>
<div className="w-full bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#991b1b] border-t-2 border-yellow-300 py-0.5 text-center shadow">
<span className="font-display text-[9px] font-black tracking-widest text-amber-100 uppercase drop-shadow">
WILD
</span>
</div>
</div>
);
}
// Inline Luxury Faceted Gem
function LuxuryGemTile({ type }: { type: "ruby" | "emerald" | "sapphire" }) {
const isRuby = type === "ruby"; const isSapph = type === "sapphire";
return (
<div className="relative size-full rounded-xl border-[2px] border-[#ca8a04] bg-gradient-to-b from-[#fef08a] via-[#ca8a04] to-[#451a03] p-1
shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_8px_rgba(0,0,0,0.85)] flex items-center justify-center">
<div className="relative size-[88%] rounded-lg border border-[#fbbf24] bg-gradient-to-b from-[#3d1502] to-[#120501] p-1 flex items-center
justify-center shadow-inner">
<div
className={`size-[82%] ${
isRuby ? "rounded-full" : isSapph ? "rotate-45 rounded-sm" : "rounded-md"
} border-2 ${
isRuby
? "border-rose-300 bg-gradient-to-br from-[#ffe4e6] via-[#e11d48] to-[#4c0519] shadow-[0_0_12px_#f43f5e]"
: isSapph
? "border-blue-300 bg-gradient-to-br from-[#dbeafe] via-[#2563eb] to-[#082f49] shadow-[0_0_12px_#3b82f6]"
: "border-emerald-300 bg-gradient-to-br from-[#d1fae5] via-[#059669] to-[#022c22] shadow-[0_0_12px_#10b981]"
} flex items-center justify-center shadow-md`}
>
<div className="size-[35%] bg-white/40 border border-white/80 rounded-xs" />
</div>
</div>
</div>
);
}
// Multiplier Lotus Badge
function AztecMultiplierBadge({ val }: { val: string | number }) {
if (val === "WHEEL") {
return (
<div className="relative size-12 rounded-full border-2 border-yellow-200 bg-gradient-to-tr from-amber-500 via-rose-600 to-yellow-300
shadow-[0_0_15px_#facc15] flex items-center justify-center animate-pulse">
<span className="font-display text-[8.5px] font-black tracking-widest text-white uppercase drop-shadow">
WHEEL
</span>
</div>
);
}
const num = Number(val);
const colorGrad =
num >= 15
? "from-rose-500 via-red-600 to-red-950"
: num >= 10
? "from-purple-500 via-purple-600 to-purple-950"
: num >= 5
? "from-blue-500 via-blue-600 to-blue-950"
: "from-emerald-500 via-emerald-600 to-emerald-950";
return (
<div className="relative size-12 flex items-center justify-center">
<svg viewBox="0 0 100 100" className="absolute inset-0 size-full drop-shadow">
<polygon
points="50,0 62,35 98,35 68,57 79,91 50,70 21,91 32,57 2,35 38,35"
fill="#d97706"
stroke="#fef08a"
strokeWidth="3.5"
/>
</svg>
<div className={`relative size-8 rounded-full border-2 border-yellow-200 bg-gradient-to-b ${colorGrad} shadow flex items-center justify-center`}>
<span className="font-display text-[12px] font-black text-yellow-100 drop-shadow">
{num}x </span>
</div>
</div>
);
}
// 3D Multiplier Wheel
function AztecWheelDisc({ rotation }: { rotation: number }) {
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
className="relative size-56 rounded-full border-[6px] border-[#fbbf24] shadow-[0_0_25px_#f59e0b,inset_0_0_15px_rgba(0,0,0,0.8)] overflow-hidden
flex items-center justify-center transition-transform duration-[1700ms] ease-out"
style={{
transform: `rotate(${rotation}deg)`,
background:
"conic-gradient(#9333ea 0deg 30deg, #16a34a 30deg 60deg, #dc2626 60deg 90deg, #0284c7 90deg 120deg, #78350f 120deg 150deg, #0284c7 150deg 180deg, #ea580c 180deg 210deg, #dc2626 210deg 240deg, #ca8a04 240deg 270deg, #dc2626 270deg 300deg, #ea580c 300deg 330deg, #16a34a 330deg 360deg)",
}}
>
{segments.map((s, i) => (
<div
key={i}
className="absolute top-2 text-[8px] font-black text-white font-mono origin-bottom h-26 drop-shadow"
style={{ transform: `rotate(${i * 30 + 15}deg)` }}
>
{s.label}
</div>
))}
<div className="absolute size-14 rounded-full border-2 border-yellow-300 bg-gradient-to-b from-[#fde047] via-[#ca8a04] to-[#713f12]
shadow-[0_0_15px_#f59e0b] flex items-center justify-center z-10">
<span className="font-display text-[9px] font-black text-black drop-shadow">JILI</span>
</div>
</div>
);
}
const STRIP_1 = ["ruby", "A", "emerald", "K", "wild", "sapphire", "ruby", "emerald", "wild", "A", "ruby"];
const STRIP_2 = ["emerald", "K", "wild", "ruby", "sapphire", "A", "emerald", "wild", "ruby", "K", "emerald"];
const STRIP_3 = ["wild", "sapphire", "ruby", "A", "emerald", "K", "wild", "ruby", "emerald", "wild", "ruby"];
const SPECIAL_STRIP = [2, 3, 5, 10, 15, "WHEEL", 2, 5, 10, 15, "WHEEL", 3];
const TILE_H = 72;
export function ReelGame() {
const { user, addScore } = useVault();
const [bet, setBet] = useState(30); const [extraBet, setExtraBet] = useState(false);
const [sound, setSound] = useState(true);
const [isSpinning, setIsSpinning] = useState(false);
const [winAmount, setWinAmount] = useState(0);
const [winActive, setWinActive] = useState(false);
const [reelStops, setReelStops] = useState<[boolean, boolean, boolean, boolean]>([true, true, true, true]);
const [reelOffsets, setReelOffsets] = useState<[number, number, number, number]>([2, 2, 2, 3]);
const wheelRotation = useRef(0);
const totalBet = extraBet ? Math.round(bet * 1.5) : bet;
const playSfx = (type: "spin" | "stop" | "win") => {
if (!sound) return;
try {
const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
if (!AudioCtx) return;
const ctx = new AudioCtx();
if (type === "spin") {
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.type = "triangle";
osc.frequency.setValueAtTime(240, ctx.currentTime);
gain.gain.setValueAtTime(0.08, ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
osc.connect(gain);
gain.connect(ctx.destination);
osc.start();
osc.stop(ctx.currentTime + 0.1);
} else if (type === "stop") {
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.type = "sine";
osc.frequency.setValueAtTime(150, ctx.currentTime);
gain.gain.setValueAtTime(0.16, ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
osc.connect(gain);
gain.connect(ctx.destination);
osc.start();
osc.stop(ctx.currentTime + 0.07);
} else if (type === "win") {
[523, 659, 783, 1046].forEach((freq, i) => {
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
}
} catch {}
};
const spin = () => {
if (isSpinning) return; if (!user || user.balance < totalBet) {
toast.error("Insufficient balance!");
return;
}
addScore(-totalBet);
setIsSpinning(true);
setWinActive(false);
setWinAmount(0);
setReelStops([false, false, false, false]);
playSfx("spin");
wheelRotation.current += 360 * 3 + Math.floor(Math.random() * 360);
const willHit = Math.random() < 0.22;
let stop0: number, stop1: number, stop2: number, stop3: number;
if (willHit) {
const matchSym = Math.random() < 0.35 ? "wild" : "ruby";
stop0 = STRIP_1.findIndex((s, i) => i >= 2 && i <= 8 && (s === matchSym || s === "wild"));
stop1 = STRIP_2.findIndex((s, i) => i >= 2 && i <= 8 && (s === matchSym || s === "wild"));
stop2 = STRIP_3.findIndex((s, i) => i >= 2 && i <= 8 && (s === matchSym || s === "wild"));
stop3 = Math.floor(Math.random() * 6) + 2;
} else {
stop0 = Math.floor(Math.random() * 5) + 2;
stop1 = (stop0 + 3) % 6 + 2;
stop2 = (stop0 + 5) % 6 + 2;
stop3 = Math.floor(Math.random() * 5) + 2;
}
setReelOffsets([stop0, stop1, stop2, stop3]);
setTimeout(() => {
setReelStops(([_, r1, r2, r3]) => [true, r1, r2, r3]);
playSfx("stop");
}, 700);
setTimeout(() => {
setReelStops(([r0, _, r2, r3]) => [r0, true, r2, r3]);
playSfx("stop");
}, 1050);
setTimeout(() => {
setReelStops(([r0, r1, _, r3]) => [r0, r1, true, r3]);
playSfx("stop");
}, 1400);
setTimeout(() => {
setReelStops([true, true, true, true]);
playSfx("stop");
setIsSpinning(false);
if (willHit) {
const multi = Number(SPECIAL_STRIP[stop3]) || 2;
const payout = Math.round(bet * 4 * multi);
addScore(payout);
setWinAmount(payout);
setWinActive(true);
playSfx("win");
      toast.success(`🎉 WIN ₹${payout.toLocaleString("en-IN")} (${multi}x)`);
    }
    }, 1750);
  };
return (
<div className="relative mx-auto max-w-[360px] overflow-hidden rounded-3xl border-4 border-[#854d0e] bg-[#0c0501] shadow-2xl font-sans select-none
text-slate-100">
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
{/* Main Shrine View */}
<div className="relative px-3 pt-2 pb-2 bg-gradient-to-b from-[#381604] via-[#1a0b02] to-[#0a0300]">
<div className="text-center mb-1">
<h2 className="font-display text-xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#fffbeb] via-[#facc15]
to-[#b45309] drop-shadow">
FORTUNE GEMS 2
</h2>
</div>
{/* Aztec Multiplier Wheel */}
<div className="relative mx-auto flex h-34 w-64 items-center justify-center overflow-hidden">
<div className="absolute -top-16">
<AztecWheelDisc rotation={wheelRotation.current} />
</div>
<div className="absolute top-0 z-20 size-0 border-x-6 border-x-transparent border-t-10 border-t-yellow-300
drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" />
</div>
{/* 3x3 Reel Matrix Viewport */}
<div className="relative h-[216px] overflow-hidden rounded-2xl border-4 border-[#b45309] bg-[#120601] p-1
shadow-[inset_0_4px_16px_rgba(0,0,0,1)]">
<div
className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] pointer-events-none z-30 transition-all duration-300 ${
winActive
? "bg-gradient-to-r from-yellow-300 via-white to-yellow-300 shadow-[0_0_24px_#fef08a] scale-y-150 animate-pulse"
: "bg-gradient-to-r from-transparent via-amber-300/80 to-transparent shadow-[0_0_12px_#f59e0b]"
}`}
/>
<div className="grid grid-cols-4 gap-1 h-full"> {/* Reels 1, 2, 3 Physical Strip Columns */}
{[STRIP_1, STRIP_2, STRIP_3].map((strip, colIdx) => {
const isLocked = reelStops[colIdx];
const targetIdx = reelOffsets[colIdx] ?? 0;
const finalTranslateY = -((targetIdx - 1) * TILE_H);
return (
<div key={colIdx} className="relative h-full overflow-hidden rounded-lg bg-[#1c0801] shadow-inner">
<div
className="w-full flex flex-col will-change-transform"
style={{
transform: isLocked ? `translate3d(0, ${finalTranslateY}px, 0)` : `translate3d(0, -576px, 0)`,
transition: isLocked
? "transform 0.45s cubic-bezier(0.1, 1.35, 0.25, 1)"
: "none",
animation: !isLocked ? "reelPhysicalRoll 0.22s linear infinite" : "none",
filter: !isLocked ? "blur(2px)" : "none",
}}
>
{strip.map((sym, idx) => (
<div key={idx} className="h-[72px] w-full p-1 flex items-center justify-center shrink-0">
{sym === "wild" && <GarudaMaskTile isHit={Boolean(winActive && isLocked)} />}
{sym === "ruby" && <LuxuryGemTile type="ruby" />}
{sym === "emerald" && <LuxuryGemTile type="emerald" />}
{sym === "sapphire" && <LuxuryGemTile type="sapphire" />}
{["A", "K"].includes(sym) && (
<div className="size-full rounded-xl border border-amber-950 bg-[#160601] flex items-center justify-center shadow-inner">
<span className="font-display text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#92400e]
drop-shadow">
{sym}
</span>
</div>
)}
</div>
))}
</div>
</div>
);
})}
{/* 4th Column: Multiplier Tower */}
<div className="relative h-full overflow-hidden rounded-lg bg-[#2b1003] border-2 border-amber-600 shadow-inner">
<div className="bg-[#92400e] text-center text-[7px] font-black uppercase text-amber-200 py-0.5">
SPECIAL
</div>
<div
className="w-full flex flex-col will-change-transform"
style={{
transform: reelStops[3]
? `translate3d(0, ${-((reelOffsets[3] - 1) * TILE_H)}px, 0)`
: `translate3d(0, -504px, 0)`,
transition: reelStops[3]
? "transform 0.48s cubic-bezier(0.1, 1.35, 0.25, 1)"
: "none",
animation: !reelStops[3] ? "reelPhysicalRoll 0.20s linear infinite" : "none",
filter: !reelStops[3] ? "blur(1.5px)" : "none",
}}
>
{SPECIAL_STRIP.map((val, idx) => ( <div key={idx} className="h-[72px] w-full p-1 flex items-center justify-center shrink-0">
<AztecMultiplierBadge val={val} />
</div>
))}
</div>
</div>
</div>
</div>
{/* Big Win Flare Overlay */}
{winActive && (
<div
onClick={() => setWinActive(false)}
className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm cursor-pointer animate-in zoom-in-95
duration-200"
>
<div className="relative flex flex-col items-center justify-center">
<div className="size-20 mb-2">
<GarudaMaskTile isHit />
</div>
<h3 className="font-display text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600
drop-shadow">
BIG WIN!
</h3>
<span className="font-mono text-3xl font-black text-emerald-400 mt-2 drop-shadow">
+₹{winAmount.toLocaleString("en-IN")}
</span>
<span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider mt-3">
Tap anywhere to continue
</span>
</div>
</div>
)}
</div>
{/* Control Console */}
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
</button> <div className="rounded-xl border border-amber-600 bg-[#0f0501] px-3 py-1 text-center shadow-inner">
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
className={`relative flex size-16 items-center justify-center rounded-full border-4 border-[#fef08a] bg-gradient-to-b from-[#fde047] via-[#ca8a04]
to-[#713f12] shadow-[0_0_25px_#f59e0b] active:scale-90 transition-transform ${
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
@keyframes reelPhysicalRoll {
0% { transform: translate3d(0, 0, 0); }
100% { transform: translate3d(0, -432px, 0); }
}
`}</style>
</div>
);
}
export default ReelGame;
