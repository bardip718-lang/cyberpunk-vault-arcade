import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault } from "@/lib/vault-store";
import { savePaymentSettings } from "@/lib/payment-settings.functions";
import { paymentSettingsQuery, PAYMENT_SETTINGS_KEY } from "@/lib/payment-settings-query";
import { toast } from "sonner";

export function PaymentSettingsPanel() {
  const { user } = useVault();
  const queryClient = useQueryClient();
  const { data: settings } = useQuery(paymentSettingsQuery);
  const save = useServerFn(savePaymentSettings);

  const [upiId, setUpiId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [referralBonus, setReferralBonus] = useState("50");

  useEffect(() => {
    if (!settings) return;
    setUpiId(settings.upiId);
    setDisplayName(settings.displayName);
    setQrUrl(settings.qrUrl);
    setReferralBonus(String(settings.referralBonus ?? 50));
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (vars: { upiId: string; displayName: string; qrUrl: string; referralBonus: number }) =>
      save({ data: { ...vars, adminEmail: user?.email ?? "" } }),
    onSuccess: async (row) => {
      queryClient.setQueryData(PAYMENT_SETTINGS_KEY, row);
      await queryClient.invalidateQueries({ queryKey: PAYMENT_SETTINGS_KEY });
      toast.success("Payment settings saved for all players");
    },
    onError: (e: Error) => toast.error(e.message || "Could not save settings"),
  });

  function submit(e: React.FormEvent) {
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
    const bonus = Number(referralBonus);
    if (!Number.isInteger(bonus) || bonus < 0 || bonus > 100000) {
      toast.error("Referral bonus must be a whole number between 0 and 100000");
      return;
    }
    mutation.mutate({ upiId: id, displayName: displayName.trim(), qrUrl: qr, referralBonus: bonus });
  }

  return (
    <section className="neon-panel rounded-xl p-5">
      <h2 className="font-display text-xl neon-text">Payment Settings</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Stored in the shared database — the Deposit modal reads these values live for every player.
      </p>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
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
        <div className="space-y-1.5">
          <Label htmlFor="set-bonus">Referral Bonus Amount (credits)</Label>
          <Input
            id="set-bonus"
            type="number"
            min={0}
            max={100000}
            value={referralBonus}
            placeholder="50"
            onChange={(e) => setReferralBonus(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
          <Button type="submit" disabled={mutation.isPending} className="font-display tracking-wide">
            {mutation.isPending ? "Saving…" : "Save Settings"}
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
