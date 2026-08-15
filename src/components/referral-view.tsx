import { useEffect, useState } from "react";
import { Copy, Check, Share2, Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";

export function ReferralView({ onSignIn }: { onSignIn: () => void }) {
  const { user, settings } = useVault();
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  if (!user || user.guest) {
    return (
      <section className="neon-panel rounded-xl p-6 text-center">
        <h2 className="font-display text-xl neon-text">Refer &amp; Earn</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with a full account to get your referral code and earn {settings.referralBonus} bonus
          credits every time a friend makes their first approved deposit.
        </p>
        <Button className="mt-4 font-display tracking-wide" onClick={onSignIn}>
          Sign in to unlock
        </Button>
      </section>
    );
  }

  const link = `${origin}/?ref=${user.referralCode}`;
  const message = `Join me on win1 — use my referral code ${user.referralCode} and start playing! ${link}`;

  async function copy(text: string, what: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      toast.success(what === "code" ? "Referral code copied" : "Referral link copied");
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.error("Copy failed — select the text manually");
    }
  }

  return (
    <section className="space-y-6">
      <div className="neon-panel rounded-xl p-5">
        <h2 className="font-display text-xl neon-text">Refer &amp; Earn</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Earn {settings.referralBonus} bonus credits when an invited friend&apos;s first deposit is
          approved.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Your referral code</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded-md bg-background px-3 py-2 font-display text-lg text-primary">
                {user.referralCode}
              </code>
              <Button variant="secondary" size="icon" aria-label="Copy referral code" onClick={() => copy(user.referralCode, "code")}>
                {copied === "code" ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Referral link</p>
            <div className="mt-2 flex items-center gap-2">
              <Input readOnly value={link} className="flex-1" />
              <Button variant="secondary" size="icon" aria-label="Copy referral link" onClick={() => copy(link, "link")}>
                {copied === "link" ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild className="font-display tracking-wide">
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
              <Share2 className="size-4" /> Share on WhatsApp
            </a>
          </Button>
          <Button asChild variant="secondary" className="font-display tracking-wide">
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(
                `Join me on win1 — code ${user.referralCode}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Share2 className="size-4" /> Share on Telegram
            </a>
          </Button>
          <Button variant="ghost" onClick={() => copy(link, "link")}>
            <Copy className="size-4" /> Copy link
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="neon-panel rounded-xl p-5">
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Users className="size-4" /> Friends invited
          </p>
          <p className="font-display text-3xl neon-text">{user.referralCount}</p>
        </div>
        <div className="neon-panel rounded-xl p-5">
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Gift className="size-4" /> Referral bonus earned
          </p>
          <p className="font-display text-3xl text-accent">{user.referralEarned}</p>
        </div>
      </div>
    </section>
  );
}
