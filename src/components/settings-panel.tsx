import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault, type AppSettings } from "@/lib/vault-store";
import { toast } from "sonner";

export function SettingsPanel() {
  const { settings, saveSettings } = useVault();
  const [form, setForm] = useState<AppSettings>(settings);

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 1_500_000) {
      toast.error("Image too large — use a file under 1.5 MB or paste a URL.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("qrUrl", String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="neon-panel rounded-xl p-5">
      <h2 className="font-display text-xl neon-text">Payment &amp; App Settings</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        These values sync instantly to the user deposit modal and reward engine.
      </p>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          saveSettings({
            ...form,
            upiId: form.upiId.trim(),
            displayName: form.displayName.trim(),
            signupBonus: Math.max(0, Math.round(Number(form.signupBonus) || 0)),
            referralBonus: Math.max(0, Math.round(Number(form.referralBonus) || 0)),
          });
          toast.success("Settings saved — deposit screen updated");
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="s-upi">Active UPI ID</Label>
            <Input id="s-upi" value={form.upiId} onChange={(e) => set("upiId", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-name">Account display name</Label>
            <Input id="s-name" value={form.displayName} onChange={(e) => set("displayName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-signup">Default signup bonus</Label>
            <Input
              id="s-signup"
              inputMode="numeric"
              value={String(form.signupBonus)}
              onChange={(e) => set("signupBonus", Number(e.target.value.replace(/\D/g, "")) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-ref">Referral bonus amount</Label>
            <Input
              id="s-ref"
              inputMode="numeric"
              value={String(form.referralBonus)}
              onChange={(e) => set("referralBonus", Number(e.target.value.replace(/\D/g, "")) || 0)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-qr">UPI QR code image URL</Label>
          <Input
            id="s-qr"
            placeholder="https://… (leave blank to use the default QR)"
            value={form.qrUrl}
            onChange={(e) => set("qrUrl", e.target.value)}
          />
          <div className="flex items-center gap-3 pt-1">
            <Input
              id="s-qr-file"
              type="file"
              accept="image/*"
              className="max-w-xs"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            {form.qrUrl && (
              <img src={form.qrUrl} alt="QR preview" className="size-16 rounded-md bg-background object-contain p-1" />
            )}
          </div>
        </div>

        <Button type="submit" className="font-display tracking-wide">
          Save Settings
        </Button>
      </form>
    </div>
  );
}
