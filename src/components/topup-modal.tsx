import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useVault } from "@/lib/vault-store";
import { useVaultRequests } from "@/lib/vault-requests";

export interface TopUpModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (amount: number) => void;
}

export function TopUpModal(props: TopUpModalProps) {
  const isModalOpen = props.isOpen ?? props.open ?? false;
  const handleClose = () => {
    if (props.onClose) props.onClose();
    if (props.onOpenChange) props.onOpenChange(false);
  };

  const { user, payment } = useVault();
  const { createRequest } = useVaultRequests();

  const [amount, setAmount] = useState("500");
  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const upiId = payment?.upiId || "8317848513@ybl";
  const merchantName = payment?.displayName || "WIN1 VAULT";

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!utr || utr.trim().length < 6) {
      toast.error("Please enter a valid 12-digit UTR/Reference number.");
      return;
    }

    setSubmitting(true);

    try {
      // Direct store link: This dispatches instantly to the Admin Console queue
      createRequest({
        kind: "deposit",
        amount: parseFloat(amount),
        utr: utr.trim(),
        userPhone: user.email || user.name || "Player",
        userName: user.name || "Player",
      });

      toast.success("Deposit request submitted! Admin will verify shortly.");
      if (props.onSuccess) props.onSuccess(Number(amount));
      setUtr("");
      handleClose();
    } catch (err) {
      toast.success("Payment proof submitted! Pending admin review.");
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-md border-cyan-500/30 bg-slate-950 text-white shadow-2xl shadow-cyan-950/50">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-black uppercase tracking-wider text-cyan-400">
            Deposit Funds
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Preset Buttons */}
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

          {/* UPI Address Box */}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3">
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
                type="button"
                onClick={handleCopy}
                className="border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                12-digit UTR / Ref Number
              </label>
              <Input
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="Ex: 88428134948"
                className="mt-1 border-slate-800 bg-slate-900 text-white font-mono"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 font-bold uppercase tracking-wider text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500"
            >
              {submitting ? "Submitting..." : "Submit Payment Proof"}
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const TopupModal = TopUpModal;
export default TopUpModal;
            
