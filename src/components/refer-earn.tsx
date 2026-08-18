import { Copy, Gift, Send, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useVault } from "@/lib/vault-store";
import { useReferral } from "@/lib/use-referral";

export function ReferEarn({ onSignIn }: { onSignIn: () => void }) {
  const { user } = useVault();
  const { profile, isLoading } = useReferral();

  if (!user || user.guest) {
    return (
      <section className="neon-panel rounded-xl p-6 text-center">
        <h2 className="font-display text-xl neon-text">Refer &amp; Earn</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with a full account to get your referral code and earn bonus credits.
        </p>
        <Button className="mt-4 font-display tracking-wide" onClick={onSignIn}>
          Sign in to unlock
        </Button>
      </section>
    );
  }

  const code = profile?.code ?? "";
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const link = code ? `${origin}/?ref=${code}` : "";
  const message = `Join me on win1 and get bonus credits! Use my referral code ${code}: ${link}`;

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Could not copy — copy it manually");
    }
  };

  return (
    <section className="space-y-6">
      <div className="neon-panel rounded-xl p-5">
        <h2 className="font-display text-xl neon-text">
          <Gift className="mr-2 inline size-5" /> Refer &amp; Earn
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Share your code — when a friend signs up and their first deposit is approved, you get a bonus.
        </p>

        {isLoading || !code ? (
          <p className="text-sm text-muted-foreground">Loading your referral code…</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Your referral code</p>
              <div className="flex gap-2">
                <Input readOnly value={code} className="font-display text-lg tracking-widest" />
                <Button variant="secondary" onClick={() => copy(code, "Referral code")}>
                  <Copy className="size-4" /> Copy
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Your referral link</p>
              <div className="flex gap-2">
                <Input readOnly value={link} />
                <Button variant="secondary" onClick={() => copy(link, "Referral link")}>
                  <Copy className="size-4" /> Copy
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="font-display tracking-wide">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" /> Share on WhatsApp
                </a>
              </Button>
              <Button asChild variant="secondary" className="font-display tracking-wide">
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(
                    `Join me on win1 — use code ${code}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send className="size-4" /> Share on Telegram
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="neon-panel rounded-xl p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            <Users className="mr-1 inline size-4" /> Total friends invited
          </p>
          <p className="font-display text-3xl text-primary">{profile?.invitedCount ?? 0}</p>
        </div>
        <div className="neon-panel rounded-xl p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            <Gift className="mr-1 inline size-4" /> Total referral bonus earned
          </p>
          <p className="font-display text-3xl text-accent">{profile?.bonusEarned ?? 0}</p>
        </div>
      </div>
    </section>
  );
}
