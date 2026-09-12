import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useVault } from "@/lib/vault-store";
import { SoundFX } from "@/lib/sound-fx";

const REWARDS = [
  { label: "₹10", value: 10, color: "#10b981" },
  { label: "₹50", value: 50, color: "#3b82f6" },
  { label: "₹20", value: 20, color: "#8b5cf6" },
  { label: "₹100", value: 100, color: "#f59e0b" },
  { label: "₹5", value: 5, color: "#06b6d4" },
  { label: "₹500", value: 500, color: "#ef4444" },
  { label: "₹25", value: 25, color: "#ec4899" },
  { label: "₹15", value: 15, color: "#14b8a6" },
];

export function DailySpinModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addScore } = useVault();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);

  const handleSpin = () => {
    if (spinning) return;

    // Trigger user click audio
    SoundFX.click();

    // Check 24hr cooldown
    const lastSpin = localStorage.getItem("win1_last_daily_spin");
    if (lastSpin) {
      const diff = Date.now() - parseInt(lastSpin, 10);
      if (diff < 24 * 60 * 60 * 1000) {
        const remainingHours = Math.ceil((24 * 60 * 60 * 1000 - diff) / (1000 * 60 * 60));
        toast.error(`Daily spin used! Come back in ${remainingHours}h.`);
        return;
      }
    }

    setSpinning(true);

    // Pick winning index (weighted towards 10, 20, 25)
    const prizeIndex = Math.floor(Math.random() * REWARDS.length);
    const segmentAngle = 360 / REWARDS.length;
    const targetRotation = rotation + 1800 + (360 - prizeIndex * segmentAngle - segmentAngle / 2);

    setRotation(targetRotation);

    // Ticking sound during spin
    let tickCount = 0;
    const tickTimer = setInterval(() => {
      SoundFX.tick();
      tickCount++;
      if (tickCount > 25) clearInterval(tickTimer);
    }, 120);

    setTimeout(() => {
      clearInterval(tickTimer);
      setSpinning(false);
      const wonPrize = REWARDS[prizeIndex]!;

      addScore(wonPrize.value);
      localStorage.setItem("win1_last_daily_spin", Date.now().toString());

      if (wonPrize.value >= 100) {
        SoundFX.bigWin();
      } else {
        SoundFX.win();
      }

      toast.success(`🎁 You won ₹${wonPrize.value} from Daily Spin!`);
    }, 3500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border border-amber-500/40 bg-slate-950/95 p-6 text-center text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 font-display text-2xl font-black text-amber-300">
            <Sparkles className="size-6 text-amber-400" /> DAILY LUCKY WHEEL
          </DialogTitle>
        </DialogHeader>

        <div className="relative my-6 flex items-center justify-center">
          {/* Wheel Pointer */}
          <div className="absolute top-0 z-20 -mt-3 h-0 w-0 border-x-8 border-x-transparent border-t-[18px] border-t-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />

          {/* Rotating Wheel Frame */}
          <div
            className="relative flex size-64 items-center justify-center rounded-full border-4 border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-transform duration-[3500ms] cubic-bezier(0.15,0.9,0.2,1)"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {REWARDS.map((r, i) => {
              const angle = (360 / REWARDS.length) * i;
              return (
                <div
                  key={i}
                  className="absolute flex h-full w-full items-start justify-center pt-2 font-display text-xs font-black"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    color: r.color,
                  }}
                >
                  <span className="rounded bg-black/60 px-1.5 py-0.5 border border-white/10">
                    {r.label}
                  </span>
                </div>
              );
            })}
            <div className="flex size-14 items-center justify-center rounded-full border-2 border-amber-400 bg-slate-900 font-display text-xs font-bold text-amber-300 shadow-md">
              WIN1
            </div>
          </div>
        </div>

        <Button
          onClick={handleSpin}
          disabled={spinning}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 py-6 font-display text-base font-black tracking-widest uppercase text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-95"
        >
          {spinning ? "Spinning..." : "SPIN FOR FREE"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
