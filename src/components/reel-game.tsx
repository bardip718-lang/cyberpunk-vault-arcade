import React, { useState } from "react";
import { Volume2, VolumeX, Maximize2, RotateCcw, ShieldCheck } from "lucide-react";
import { useVault } from "@/lib/vault-store";

export function ReelGame() {
  const { user } = useVault();
  const [sound, setSound] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  // Official JILI / TaDa Gaming Fortune Gems 2 WebGL Engine URL
  // Jab aggregator (SoftGamings/SOFTSWISS) se live API key mile, bas niche URL me token append karna hai
  const gameUrl = `https://demo.tada-gaming.com/slot/fortune-gems-2?lang=en&currency=INR`;

  const reloadGame = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="relative mx-auto flex h-[82vh] w-full max-w-[420px] flex-col overflow-hidden rounded-3xl border-4 border-[#854d0e] bg-[#0c0501] shadow-2xl font-sans select-none text-slate-100">
      
      {/* 1win Header Top Bar */}
      <div className="flex items-center justify-between border-b border-amber-900/60 bg-[#140802] px-3 py-2 z-20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSound(!sound)}
            className="text-amber-400 hover:text-amber-200 transition-colors"
          >
            {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          <div className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
              JILI Official Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-md border border-amber-800 bg-[#220d02] px-2 py-0.5 text-right">
            <span className="text-[9px] uppercase tracking-wider text-amber-400 block font-bold">
              Balance
            </span>
            <span className="font-mono text-xs font-black text-emerald-400">
              ₹{user?.balance?.toLocaleString("en-IN") || "0.00"}
            </span>
          </div>

          <button
            type="button"
            onClick={reloadGame}
            title="Reload Engine"
            className="text-amber-400 hover:text-amber-200 transition-transform active:rotate-180"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>

      {/* Main Official WebGL Game Container */}
      <div className="relative flex-1 w-full bg-black">
        <iframe
          key={iframeKey}
          src={gameUrl}
          title="Fortune Gems 2 - JILI Games"
          className="size-full border-0"
          allow="autoplay; fullscreen; screen-wake-lock"
          allowFullScreen
          loading="eager"
        />
      </div>

      {/* Bottom 1win Provider Tag */}
      <div className="flex items-center justify-between border-t border-amber-900/50 bg-[#120601] px-3 py-1.5 text-[10px] text-amber-500/80 font-mono">
        <span>TaDa Gaming / JILI</span>
        <span className="text-emerald-500 font-bold">● High Performance WebGL 60FPS</span>
      </div>

    </div>
  );
}

export default ReelGame;
