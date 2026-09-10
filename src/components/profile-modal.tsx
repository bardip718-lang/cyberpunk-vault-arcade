import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, ShieldCheck, Wallet, Trophy, Flame, LogOut, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useVault } from "@/lib/vault-store";

export function ProfileModal({
  open,
  onOpenChange,
  onDeposit,
  onWithdraw,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeposit: () => void;
  onWithdraw: () => void;
}) {
  const { user, signOut } = useVault();
  const phone = localStorage.getItem("win1_user_phone");

  const totalDeposited = user?.totalDeposited || 0;
  const vipTier = totalDeposited >= 5000 ? "VIP Diamond" : totalDeposited >= 1000 ? "VIP Gold" : "VIP Silver";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border border-cyan-500/30 bg-slate-950/95 p-6 text-foreground">
        <DialogHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl border-2 border-primary bg-primary/20 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <User className="size-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl font-black tracking-wide text-foreground">
                {phone ? `+91 ${phone}` : user?.name || "Guest Player"}
              </DialogTitle>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">{vipTier}</span>
                <span>• UID: {user?.id?.slice(-6) || "000000"}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Vault Balance Cards */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Real Balance</span>
            <p className="font-display text-2xl font-black text-cyan-400 mt-1">
              ₹{user ? user.realBalance : 0}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Bonus Credits</span>
            <p className="font-display text-2xl font-black text-amber-400 mt-1">
              ₹{user ? user.bonusBalance : 0}
            </p>
          </div>
        </div>

        {/* Action Quick Links */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            onClick={() => {
              onOpenChange(false);
              onDeposit();
            }}
            className="font-display text-xs tracking-wider"
          >
            <ArrowDownToLine className="mr-1.5 size-4" /> Deposit Cash
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              onOpenChange(false);
              onWithdraw();
            }}
            className="font-display text-xs tracking-wider"
          >
            <ArrowUpFromLine className="mr-1.5 size-4" /> Withdraw
          </Button>
        </div>

        {/* Player Stats */}
        <div className="space-y-2 rounded-xl border border-border/40 bg-slate-900/40 p-3 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Total Deposited</span>
            <span className="font-bold text-foreground font-mono">₹{totalDeposited}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Wager Turnover Left</span>
            <span className="font-bold text-foreground font-mono">₹{user?.wagerRemaining || 0}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Daily Spin Status</span>
            <span className="font-bold text-emerald-400">Available Daily</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 border-t border-border/50 pt-4 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem("win1_user_phone");
              if (signOut) signOut();
              onOpenChange(false);
            }}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 text-xs"
          >
            <LogOut className="mr-1.5 size-3.5" /> Sign Out
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
      }
