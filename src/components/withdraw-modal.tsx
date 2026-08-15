import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";

export function WithdrawModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { user, submitWithdrawal } = useVault();
  const [amount, setAmount] = useState("100");
  const [destination, setDestination] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 100) {
      setError("Minimum withdrawal is 100 credits.");
      return;
    }
    if (user && amt > user.main) {
      setError(
        user.bonus > 0
          ? "Bonus balance cannot be withdrawn directly. Play games to convert bonus credits into withdrawable cash winnings!"
          : "Withdrawal exceeds your withdrawable balance.",
      );
      return;
    }
    if (destination.trim().length < 6) {
      setError("Enter a valid UPI ID or bank account details.");
      return;
    }
    submitWithdrawal(Math.round(amt), destination.trim());
    setError(null);
    setDestination("");
    toast.success("Withdrawal request sent for operator approval");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neon-panel max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl neon-text">Vault Withdrawal</DialogTitle>
          <DialogDescription>
            Request a payout to your UPI ID or bank account. Credits are deducted on approval.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm">
          Withdrawable (main) balance{" "}
          <span className="font-display text-lg text-primary">{user ? user.main : 0}</span>
          <p className="mt-1 text-xs text-muted-foreground">
            Bonus balance {user ? user.bonus : 0} — non-withdrawable. Play games to convert bonus credits
            into withdrawable cash winnings.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="w-amount">Withdrawal amount (credits)</Label>
            <Input
              id="w-amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="w-dest">UPI ID / Bank details</Label>
            <Textarea
              id="w-dest"
              rows={3}
              placeholder="yourname@upi  or  A/C 1234567890, IFSC ABCD0001234"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full font-display tracking-wide">
            Submit Withdrawal
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
