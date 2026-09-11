import React, { useState } from "react";
import { ArrowLeft, Volume2, VolumeX, Maximize2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVault } from "@/lib/vault-store";

export function ReelGame() {
  const { user } = useVault();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  // Official JILI Games Authentic H5 / WebGL Web Engine
  const jiliGameUrl = "https://demo.jiligames.com/slot/fortune-gems-2";

  return (
    <div className="relative mx-auto flex h-full min-h-[620px] max-w-md flex-col overflow-hidden rounded-3xl border border-slate-800 bg-[#080b12] shadow-2xl font-sans select-none text-slate-100">
      
      {/* 1win Header Controls */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#0d121d] px-3.5 py-2 z-20">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-amber-400">
            JILI Fortune Gems 2
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="rounded-lg border border-slate-800 bg-[#141b29] p-1.5 text-slate-400 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="size-3.5 text-amber-400" /> : <VolumeX className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setFullscreen(!fullscreen)}
            className="rounded-lg border border-slate-800 bg-[#141b29] p-1.5 text-slate-400 hover:text-white"
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 100% Authentic Original JILI WebGL / Canvas Container */}
      <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
        <iframe
          src={jiliGameUrl}
          title="Fortune Gems 2 Authentic JILI Engine"
          className="w-full h-full min-h-[560px] border-0 select-none"
          allow="autoplay; fullscreen; encrypted-media"
        />

        {/* Fallback Live Overlay Indicator */}
        <div className="absolute bottom-2 left-3 pointer-events-none flex items-center gap-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/20 backdrop-blur-sm">
          <Sparkles className="size-3 text-amber-300" />
          <span>OFFICIAL JILI H5 ENGINE</span>
        </div>
      </div>

      {/* Bottom Vault Synced Status Bar */}
      <div className="flex items-center justify-between border-t border-slate-800/80 bg-[#0d121d] px-4 py-2 text-[11px] font-bold">
        <div className="flex items-center gap-1 text-slate-400">
          <span>Active Player Vault:</span>
          <span className="font-mono text-emerald-400 font-black">
            ₹{user?.balance ? user.balance.toLocaleString("en-IN") : "0.00"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 text-[10px]">
          <ShieldCheck className="size-3 text-blue-400" />
          <span>Provably Fair RNG</span>
        </div>
      </div>

    </div>
  );
}

export default ReelGame;
