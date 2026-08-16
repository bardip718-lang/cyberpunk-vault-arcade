import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault, DEFAULT_PAYMENT_SETTINGS } from "@/lib/vault-store";
import { toast } from "sonner";

export function PaymentSettingsPanel() {
  const { payment, updatePaymentSettings } = useVault();
  const current = { ...DEFAULT_PAYMENT_SETTINGS, ...(payment ?? {}) };
  const [upiId, setUpiId] = useState(current.upiId);
  const [displayName, setDisplayName] = useState(current.displayName);
  const [qrUrl, setQrUrl] = useState(current.qrUrl);

  useEffect(() => {
    setUpiId(current.upiId);
    setDisplayName(current.displayName);
    setQrUrl(current.qrUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment]);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const id = upiId.trim();
    if (id.length < 5 || id.length > 100 || !/^[\w.\-]{2,}@[\w.\-]{2,}$/.test(id)) {
      toast.error("Enter a valid UPI ID like name@bank");
      return;
    }
    if (displayName.trim().length === 0 || displayName.trim().length > 60) {
      toast.error("Display name must be 1–60 characters");
      return;
    }
    const qr = qrUrl.trim();
    if (qr.length > 0 && !/^(https?:\/\/|\/)/.test(qr)) {
      toast.error("QR image URL must start with http(s):// or /");
      return;
    }
    updatePaymentSettings({
      upiId: id,
      displayName: displayName.trim(),
      qrUrl: qr || DEFAULT_PAYMENT_SETTINGS.qrUrl,
    });
    toast.success("Payment settings saved");
  }

  return (
    <section className="neon-panel rounded-xl p-5">
      <h2 className="font-display text-xl neon-text">Payment Settings</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        These values power the Deposit modal for every player.
      </p>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="set-upi">UPI ID</Label>
          <Input
            id="set-upi"
            value={upiId}
            maxLength={100}
            placeholder="yourupi@okaxis"
            onChange={(e) => setUpiId(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="set-name">Display Name</Label>
          <Input
            id="set-name"
            value={displayName}
            maxLength={60}
            placeholder="WIN1 VAULT"
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="set-qr">UPI QR Code Image URL</Label>
          <Input
            id="set-qr"
            value={qrUrl}
            maxLength={500}
            placeholder="https://example.com/qr.png"
            onChange={(e) => setQrUrl(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
          <Button type="submit" className="font-display tracking-wide">
            Save Settings
          </Button>
          {qrUrl.trim() && (
            <img
              src={qrUrl.trim()}
              alt="Current UPI QR preview"
              width={72}
              height={72}
              loading="lazy"
              className="rounded-md bg-background p-1"
            />
          )}
        </div>
      </form>
    </section>
  );
}
