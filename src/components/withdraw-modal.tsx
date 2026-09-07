import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lock, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { REQUESTS_KEY } from "@/lib/requests-query";
import { useVault } from "@/lib/vault-store";
import { useVaultRequests } from "@/lib/use-vault-requests";
import { toast } from "sonner";

export function WithdrawModal({
  open,
  onOpenChange,
  onSignIn,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSignIn?: () => void;
}) {
  const { user, withdrawable, withdrawLock, lockWithdrawal } = useVault();
  const { createRequest } = useVaultRequests();
  const [amount, setAmount] = useState("100");
  const [destination, setDestination] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (withdrawLock.locked) {
      setError(withdrawLock.reason);
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 100) {
      setError("Minimum withdrawal is 100 credits.");
      return;
    }
    if (amt > withdrawable) {
      setError("Withdrawal exceeds your withdrawable real cash.");
      return;
    }
    if (destination.trim().length < 6) {
      setError("Enter a valid UPI ID or bank account details.");
      return;
    }
    setSubmitting(true);
    try {
      // Hold (deduct) the requested amount immediately; refunded on rejection.
      lockWithdrawal(Math.round(amt));
      await createRequest({
        kind: "withdrawal",
        userKey: user.id,
        userName: user.name,
        userEmail: user.email,
        amount: Math.round(amt),
        destination: destination.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
      setError(null);
      setDestination("");
      toast.success("Request Submitted — awaiting operator approval");
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit withdrawal";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neon-panel max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl neon-text">Vault Withdrawal</DialogTitle>
          <DialogDescription>
            {user.guest
              ? "Real payouts are only available on verified mobile accounts."
              : "Request a payout to your UPI ID or bank account. Credits are held on submission and refunded if rejected."}
          </DialogDescription>
        </DialogHeader>

        {withdrawLock.locked ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/40 bg-primary/5 p-5 text-center">
              <Lock className="mx-auto size-8 text-primary" />
              <p className="mt-3 font-display text-lg text-foreground">Withdrawals locked</p>
              <p className="mt-1 text-sm text-muted-foreground">{withdrawLock.reason}</p>
            </div>
            {!user.guest && (
              <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm">
                <p>
                  Real cash <span className="font-display text-primary">₹{user.realBalance}</span>
                </p>
                <p className="text-muted-foreground">
                  Bonus cash ₹{user.bonusBalance} · turnover left ₹{user.wagerRemaining}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              {user.guest && onSignIn && (
                <Button
                  className="w-full font-display tracking-wide"
                  onClick={() => {
                    onOpenChange(false);
                    onSignIn();
                  }}
                >
                  <ShieldCheck className="size-4" /> Verify mobile number
                </Button>
              )}
              <Button variant="secondary" className="w-full" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm">
              Withdrawable real cash{" "}
              <span className="font-display text-lg text-primary">₹{withdrawable}</span>
              {user.bonusBalance > 0 && (
                <p className="text-xs text-muted-foreground">
                  Bonus ₹{user.bonusBalance} · turnover left ₹{user.wagerRemaining}
                </p>
              )}
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

              <Button type="submit" disabled={submitting} className="w-full font-display tracking-wide">
                {submitting ? "Submitting…" : "Submit Withdrawal"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
