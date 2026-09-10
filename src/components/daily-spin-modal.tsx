import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, Gift } from "lucide-react";
import { toast } from "sonner";
import { useVault } from "@/lib/vault-store";

const SECTORS = [
  { label: "₹5", value: 5, color: "#06b6d4" },
  { label: "₹10", value: 10, color: "#3b82f6" },
  { label: "₹50", value: 50, color: "#8b5cf6" },
  { label: "TRY AGAIN", value: 0, color: "#64748b" },
  { label: "₹25", value: 25, color: "#10b981" },
  { label: "₹100", value: 100, color: "#ec4899" },
  { label: "₹15", value: 15, color: "#f59e0b" },
  { label: "JACKPOT", value: 500, color: "#e11d48" },
];

export function DailySpinModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { creditBalance } = useVault();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [canSpin, setCanSpin] = useState(true);
  const [cooldownTime, setCooldownTime] = useState<string | null>(null);

  useEffect(() => {
    const lastSpin = localStorage.getItem("win1_last_daily_spin");
    if (lastSpin) {
      const diffHours = (Date.now() - parseInt(lastSpin, 10)) / (1000 * 60 * 60);
      if (diffHours < 24) {
        setCanSpin(false);
        const remHours = Math.ceil(24 - diffHours);
        setCooldownTime(`${remHours}h left`);
      } else {
        setCanSpin(true);
      }
    }
  }, [open]);

  const handleSpin = () => {
    if (!canSpin || spinning) return;

    setSpinning(true);

    // Weighted index: standard prizes have higher hit-rate
    const winningIndex = Math.floor(Math.random() * SECTORS.length);
    const sectorAngle = 360 / SECTORS.length;
    const extraRounds = 5 * 360;
    const targetRotation =
      rotation + extraRounds + (360 - winningIndex * sectorAngle - sectorAngle / 2);

    setRotation(targetRotation);

    setTimeout(() => {
      setSpinning(false);
      setCanSpin(false);
      localStorage.setItem("win1_last_daily_spin", Date.now().toString());

      const won = SECTORS[winningIndex];
      if (won.value > 0) {
        creditBalance(won.value);
        toast.success(`🎉 You won ${won.label}! Added directly to your vault balance.`);
      } else {
        toast.info("Better luck tomorrow! Keep spinning daily.");
      }
    }, 4500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-cyan-500/40 bg-slate-950 text-white shadow-[0_0_50px_rgba(6,182,212,0.25)]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-center font-display text-2xl font-black uppercase tracking-wider text-cyan-400">
            <Sparkles className="size-6 text-cyan-400 animate-pulse" />
            Spin To Win Daily
          </DialogTitle>
          <p className="text-center text-xs text-slate-400">
            Spin the cyberpunk wheel once every 24 hours to win free rewards!
          </p>
        </DialogHeader>

        <div className="relative my-6 flex flex-col items-center justify-center">
          {/* Pointer indicator */}
          <div className="absolute -top-3 z-20 h-0 w-0 border-x-8 border-x-transparent border-t-[18px] border-t-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />

          {/* Wheel Graphic */}
          <div
            className="relative size-64 rounded-full border-4 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-transform duration-[4500ms] cubic-bezier(0.15,0.9,0.2,1)"
            style={{
              transform: `rotate(${rotation}deg)`,
              background: `conic-gradient(
                #06b6d4 0deg 45deg,
                #3b82f6 45deg 90deg,
                #8b5cf6 90deg 135deg,
                #475569 135deg 180deg,
                #10b981 180deg 225deg,
                #ec4899 225deg 270deg,
                #f59e0b 270deg 315deg,
                #e11d48 315deg 360deg
              )`,
            }}
          >
            {/* Center Cap */}
            <div className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-cyan-300 bg-slate-950 font-display text-xs font-black tracking-widest text-cyan-400 shadow-inner">
              <Gift className="size-6 animate-bounce text-cyan-300" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-2 text-center">
          <Button
            type="button"
            disabled={!canSpin || spinning}
            onClick={handleSpin}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 py-6 font-display text-base font-bold tracking-widest uppercase text-white shadow-lg transition-all hover:scale-[1.02] hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
          >
            {spinning ? (
              "Spinning..."
            ) : canSpin ? (
              <span className="flex items-center justify-center gap-2">
                <Trophy className="size-5" /> Free Spin
              </span>
            ) : (
              `Come Back Tomorrow (${cooldownTime || "Locked"})`
            )}
          </Button>

          <p className="text-[11px] text-slate-500">
            Free credit applies instantly to real score balance without wagering locks.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DailySpinModal;
            
