import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault } from "@/lib/vault-store";
import { paymentSettingsQuery, PAYMENT_SETTINGS_KEY, FALLBACK_QR } from "@/lib/payment-settings-query";
import { toast } from "sonner";

const PRESETS = [100, 250, 500, 1000];

export function TopUpModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { submitOrder } = useVault();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery(paymentSettingsQuery);

  // Refetch the live settings every time the modal opens.
  useEffect(() => {
    if (open) queryClient.invalidateQueries({ queryKey: PAYMENT_SETTINGS_KEY });
  }, [open, queryClient]);

  const upiId = settings?.upiId ?? "";
  const displayName = settings?.displayName ?? "";
  const qrSrc = settings?.qrUrl?.trim() ? settings.qrUrl.trim() : FALLBACK_QR;

  const [amount, setAmount] = useState("250");
  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyId() {
    if (!upiId) return;
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      toast.success("UPI ID copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy failed — select the ID manually");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 10 || amt > 100000) {
      setError("Enter an amount between 10 and 100,000.");
      return;
    }
    if (!/^\d{12}$/.test(utr.trim())) {
      setError("Reference/UTR must be exactly 12 digits.");
      return;
    }
    submitOrder(Math.round(amt), utr.trim());
    setError(null);
    setUtr("");
    toast.success("Order queued — awaiting operator approval");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neon-panel max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl neon-text">Vault Top-Up</DialogTitle>
          <DialogDescription>
            Pay via UPI, then submit your 12-digit reference number for approval.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-secondary/40 p-4">
          <img
            src={qrSrc}
            alt={upiId ? `UPI payment QR code for ${upiId}` : "UPI payment QR code"}
            width={300}
            height={300}
            loading="lazy"
            className="rounded-md bg-background p-2"
          />
          <p className="font-display text-sm text-accent">{displayName}</p>
          <div className="flex w-full items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-background px-3 py-2 text-sm text-primary">
              {isLoading ? "Loading payment details…" : upiId || "No UPI ID configured yet"}
            </code>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              disabled={!upiId}
              onClick={copyId}
              aria-label="Copy UPI ID"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (credits)</Label>
            <Input
              id="amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESETS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={amount === String(p) ? "default" : "secondary"}
                  onClick={() => setAmount(String(p))}
                >
                  ₹{p}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="utr">Reference / UTR number</Label>
            <Input
              id="utr"
              inputMode="numeric"
              placeholder="12-digit UTR"
              value={utr}
              onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full font-display tracking-wide">
            Submit Order
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
