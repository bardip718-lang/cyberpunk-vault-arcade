import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, ArrowUpRight, ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { paymentSettingsQuery, FALLBACK_QR } from "@/lib/payment-settings-query";
import { useVault } from "@/lib/vault-store";
import { useVaultRequests } from "@/lib/use-vault-requests";

export interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
}

export function TopUpModal({ isOpen, onClose, onSuccess }: TopUpModalProps) {
  const { user } = useVault();
  const { createRequest, isCreating } = useVaultRequests();
  const { data: settings } = useQuery({
    ...paymentSettingsQuery,
    refetchOnMount: "always",
    enabled: isOpen,
  });

  const [amount, setAmount] = useState("250");
  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState(false);
  const [screenshot, setScreenshot] = useState<{ dataUrl: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upiId = settings?.upiId?.trim() || "8317848513@ybl";
  const merchantName = settings?.displayName?.trim() || "WIN1 VAULT";
  const qrUrl = settings?.qrUrl?.trim() || FALLBACK_QR;

  useEffect(() => {
    if (!isOpen) {
      setUtr("");
      setScreenshot(null);
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success("UPI ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (screenshot).");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Screenshot must be under 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshot({ dataUrl: String(reader.result), name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.guest) {
      toast.error("Please sign in with your mobile number to deposit real cash.");
      return;
    }
    const amt = Math.round(Number(amount));
    if (!amt || amt < 1) {
      toast.error("Enter a valid deposit amount.");
      return;
    }
    if (!/^\d{12}$/.test(utr.trim())) {
      toast.error("Please enter a valid 12-digit UTR/Reference number.");
      return;
    }
    try {
      await createRequest({
        kind: "deposit",
        userKey: user.id,
        userName: user.name,
        userEmail: user.email,
        amount: amt,
        utr: utr.trim(),
        screenshotDataUrl: screenshot?.dataUrl ?? "",
      });
      toast.success("Deposit request submitted! Admin will verify shortly.");
      onSuccess?.(amt);
      onClose();
      setUtr("");
      setScreenshot(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed. Try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-cyan-500/30 bg-slate-950 text-white shadow-2xl shadow-cyan-950/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-black uppercase tracking-wider text-cyan-400">
            Deposit Funds
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Select Amount (₹)
            </label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {["100", "250", "500", "1000"].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`rounded-lg border py-2 text-sm font-bold transition-all ${
                    amount === val
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                      : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter Custom Amount"
              className="mt-2 border-slate-800 bg-slate-900 text-white focus-visible:ring-cyan-500"
            />
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 space-y-3">
            <div className="flex justify-center">
              <img
                src={qrUrl}
                alt={`UPI QR code for ${merchantName}`}
                className="w-44 h-44 rounded-lg border border-cyan-500/30 bg-white object-contain"
                loading="lazy"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-cyan-300 font-bold">
                  Admin Receiving UPI
                </p>
                <p className="font-mono text-sm font-semibold text-white">{upiId}</p>
                <p className="text-[10px] text-slate-400">Merchant: {merchantName}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                12-digit UTR / Ref Number
              </label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={12}
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                placeholder="Ex: 423456789012"
                className="mt-1 border-slate-800 bg-slate-900 text-white font-mono"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Payment Screenshot (optional)
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {screenshot ? (
                <div className="mt-1 relative rounded-lg border border-slate-800 overflow-hidden">
                  <img
                    src={screenshot.dataUrl}
                    alt="Payment screenshot preview"
                    className="w-full max-h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setScreenshot(null)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-slate-950/80 p-1 text-slate-300 hover:text-white"
                    aria-label="Remove screenshot"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-900/60 py-3 text-xs text-slate-400 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors"
                >
                  <ImagePlus className="h-4 w-4" /> Upload payment screenshot
                </button>
              )}
            </div>

            <Button
              type="submit"
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 font-bold uppercase tracking-wider text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  Submit Payment Proof
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <p className="text-center text-[10px] text-slate-500">
              Status stays PENDING until the operator verifies your UTR.
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Aliases for backward compatibility
export const TopupModal = TopUpModal;
export default TopUpModal;
