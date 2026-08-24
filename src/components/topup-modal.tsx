import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, ArrowDownToLine } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { useVaultRequests } from "@/lib/use-vault-requests";
import { notifyTelegram } from "@/lib/notify";

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TopUpModal({ open, onOpenChange }: TopUpModalProps) {
  const { config, user } = useVault();
  const { createRequest } = useVaultRequests();
  const [amount, setAmount] = useState<number>(250);
  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const upiId = config?.upiId || "8317848513@ybl";
  const upiName = config?.upiName || "WIN1 VAULT";
  const cleanUpi = upiId.trim();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${encodeURIComponent(cleanUpi)}%26pn=${encodeURIComponent(upiName)}%26am=${amount}%26cu=INR`;

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(cleanUpi);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utr.trim();

    if (!cleanUtr || cleanUtr.length < 6) {
      alert("Please enter a valid 12-digit UPI / UTR Transaction ID");
      return;
    }

    setSubmitting(true);
    const savedPhone = localStorage.getItem("win1_user_phone");
    const userIdentifier = savedPhone ? `+91 ${savedPhone}` : user?.email || "Guest Player";

    try {
      if (typeof createRequest === "function") {
        await createRequest({
          type: "topup",
          amount: Number(amount),
          utr: cleanUtr,
          userEmail: userIdentifier,
        });
      }

      await notifyTelegram(
        `📥 *NEW DEPOSIT REQUEST*\n\n` +
        `👤 *User:* \`${userIdentifier}\`\n` +
        `💰 *Amount:* ₹${amount}\n` +
        `🔢 *UTR:* \`${cleanUtr}\``
      );

      setSuccess(true);
      setUtr("");
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      alert("Error submitting request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neon-panel border-primary/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl neon-text flex items-center gap-2">
            <ArrowDownToLine className="size-6 text-primary" /> Vault Top-Up
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Pay via UPI, then submit 12-digit UTR reference number.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="size-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center animate-bounce">
              <Check className="size-8" />
            </div>
            <h3 className="font-display text-xl text-foreground font-bold">Deposit Submitted!</h3>
            <p className="text-xs text-muted-foreground">
              ₹{amount} will be credited once verified by operator.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-background/60">
              <div className="bg-white p-2.5 rounded-lg shadow-md mb-2">
                <img
                  src={qrUrl}
                  alt={`UPI payment QR code for ${cleanUpi}`}
                  className="size-44 object-contain"
                />
              </div>
              <p className="text-xs font-display font-semibold text-primary">{upiName}</p>

              <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-secondary/80 px-3 py-1.5 text-xs font-mono">
                <span>{cleanUpi}</span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="hover:text-primary transition-colors"
                  aria-label="Copy UPI ID"
                >
                  {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Select Amount</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESET_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    size="sm"
                    variant={amount === amt ? "default" : "outline"}
                    onClick={() => setAmount(amt)}
                    className="font-display font-semibold text-xs"
                  >
                    ₹{amt}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="deposit-amount" className="text-xs text-muted-foreground">Amount (₹)</Label>
              <Input
                id="deposit-amount"
                type="number"
                min={10}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="font-display"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="deposit-utr" className="text-xs text-muted-foreground">
                12-digit UPI / UTR Reference No.
              </Label>
              <Input
                id="deposit-utr"
                type="text"
                placeholder="e.g. 521061008271"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                className="font-display"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full py-5 font-display tracking-wider uppercase font-bold"
            >
              {submitting ? "Submitting Request..." : `Submit Deposit (₹${amount})`}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
    );
}


      
                
    

              
