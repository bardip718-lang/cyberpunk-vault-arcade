import { useEffect, useRef, useState } from "react";
import { Check, Copy, ImageUp, Loader2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault } from "@/lib/vault-store";
import { useVaultRequests } from "@/lib/use-vault-requests";
import { usePaymentSettings } from "@/lib/payment-settings-query";
import { toast } from "sonner";

export interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
}

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];
const MIN_DEPOSIT = 100;

export function TopUpModal({ isOpen, onClose, onSuccess }: TopUpModalProps) {
  const { user, payment } = useVault();
  const { createRequest, isCreating } = useVaultRequests();
  const settingsQuery = usePaymentSettings(isOpen);

  const [amount, setAmount] = useState<string>("100");
  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState(false);
  const [shot, setShot] = useState<{ dataUrl: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const live = settingsQuery.data;
  const upiId = live?.upiId || payment.upiId;
  const displayName = live?.displayName || payment.displayName;
  const qrUrl = live?.qrCodeUrl || payment.qrUrl;

  useEffect(() => {
    if (!isOpen) {
      setDone(false);
      setError(null);
    }
  }, [isOpen]);

  async function copyUpi() {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Please copy the ID manually.");
    }
  }

  function pickFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image of your payment receipt.");
      return;
    }
    if (file.size > 4_000_000) {
      setError("Screenshot is too large (max 4MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setShot({ dataUrl: String(reader.result), name: file.name });
    reader.readAsDataURL(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (user.guest) {
      setError("Please sign in with your mobile number to deposit real cash.");
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < MIN_DEPOSIT) {
      setError(`Minimum deposit is ₹${MIN_DEPOSIT}.`);
      return;
    }
    if (!/^\d{12}$/.test(utr.trim())) {
      setError("Enter the 12-digit UTR / reference number from your payment app.");
      return;
    }
    setError(null);
    try {
      await createRequest({
        kind: "deposit",
        userKey: user.id,
        userName: user.name,
        userEmail: user.email,
        amount: Math.round(amt),
        utr: utr.trim(),
        screenshotDataUrl: shot?.dataUrl ?? "",
      });
      setDone(true);
      setUtr("");
      setShot(null);
      toast.success("Deposit submitted — pending operator approval");
      onSuccess?.(Math.round(amt));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit deposit";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="neon-panel max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl neon-text">Deposit Credits</DialogTitle>
          <DialogDescription>
            Pay to the UPI ID below, then submit the amount, 12-digit UTR and a screenshot. An
            operator verifies it and your real cash balance updates.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-4 py-4 text-center">
            <ShieldCheck className="mx-auto size-10 text-emerald-400" />
            <p className="font-display text-lg">Deposit request received</p>
            <p className="text-sm text-muted-foreground">
              Status is <span className="font-display text-amber-400">PENDING</span>. Your real cash
              is credited as soon as the operator approves it.
            </p>
            <Button className="w-full font-display" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-background/60 p-4 text-center">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`UPI QR code for ${displayName}`}
                  width={220}
                  height={220}
                  className="mx-auto rounded-lg"
                />
              ) : null}
              <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
                {displayName}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-secondary/70 px-3 py-2">
                <span className="font-mono text-sm font-bold text-primary">{upiId}</span>
                <Button type="button" size="sm" variant="ghost" onClick={copyUpi}>
                  {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Deposit amount (₹)</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {PRESET_AMOUNTS.map((a) => (
                    <Button
                      key={a}
                      type="button"
                      size="sm"
                      variant={Number(amount) === a ? "default" : "outline"}
                      onClick={() => setAmount(String(a))}
                      className="font-display text-xs"
                    >
                      ₹{a}
                    </Button>
                  ))}
                </div>
                <Input
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                  placeholder={`Minimum ₹${MIN_DEPOSIT}`}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="utr">12-digit UTR / reference number</Label>
                <Input
                  id="utr"
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="e.g. 302145879654"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Payment screenshot</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full font-display"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImageUp className="size-4" /> {shot ? "Change screenshot" : "Upload screenshot"}
                </Button>
                {shot && (
                  <div className="flex items-center gap-3 rounded-lg border border-border p-2">
                    <img src={shot.dataUrl} alt="Payment proof preview" className="size-14 rounded object-cover" />
                    <span className="truncate text-xs text-muted-foreground">{shot.name}</span>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={isCreating} className="w-full font-display tracking-wide">
                {isCreating ? <Loader2 className="size-4 animate-spin" /> : null}
                {isCreating ? "Submitting…" : "Submit Deposit Request"}
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default TopUpModal;
