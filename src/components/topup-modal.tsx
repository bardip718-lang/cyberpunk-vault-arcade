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
import { Copy, Check, ArrowDownToLine, MessageCircle } from "lucide-react";
import { useVault } from "@/lib/vault-store";

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];
const ADMIN_WHATSAPP_NUMBER = "918317848513"; // Aapka WhatsApp Number

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TopUpModal({ open, onOpenChange }: TopUpModalProps) {
  const { payment, user } = useVault();
  const [amount, setAmount] = useState<number>(250);
  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState(false);

  const upiId = payment?.upiId || "8317848513@ybl";
  const upiName = payment?.displayName || "WIN1 VAULT";
  const cleanUpi = upiId.trim();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${encodeURIComponent(cleanUpi)}%26pn=${encodeURIComponent(upiName)}%26am=${amount}%26cu=INR`;

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(cleanUpi);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utr.trim();

    if (!cleanUtr || cleanUtr.length < 4) {
      alert("Please enter a valid UTR / Reference Number.");
      return;
    }

    const savedPhone = typeof window !== "undefined" ? localStorage.getItem("win1_user_phone") : null;
    const userIdentifier = savedPhone ? `+91 ${savedPhone}` : (user?.name || "Player");

    // WhatsApp pre-filled message
    const msg = encodeURIComponent(
      `🎮 *WIN1 VAULT DEPOSIT REQUEST*\n\n` +
      `👤 *User / Phone:* ${userIdentifier}\n` +
      `💰 *Amount Paid:* ₹${amount}\n` +
      `🔢 *UTR Reference:* ${cleanUtr}\n\n` +
      `Please verify payment and credit my balance.`
    );

    const waLink = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${msg}`;
    window.open(waLink, "_blank");

    onOpenChange(false);
    setUtr("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neon-panel border-primary/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl neon-text flex items-center gap-2">
            <ArrowDownToLine className="size-6 text-primary" /> Vault Top-Up
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Scan &amp; pay via UPI, then send UTR screenshot directly on WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleWhatsAppSubmit} className="space-y-4 pt-1">
          <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-background/60">
            <div className="bg-white p-2.5 rounded-lg shadow-md mb-2">
              <img
                src={qrUrl}
                alt={`UPI QR code for ${cleanUpi}`}
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
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-display tracking-wider uppercase font-bold flex items-center justify-center gap-2"
          >
            <MessageCircle className="size-5" /> Submit via WhatsApp (₹{amount})
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
              }
