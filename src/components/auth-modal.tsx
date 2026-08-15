import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";

export function AuthModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { signIn, signUp, playAsGuest, settings } = useVault();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      setReferral(ref.toUpperCase());
      setMode("signup");
    }
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.length < 4) {
      setError("Enter a valid email and a password of at least 4 characters.");
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      setError("Enter your operator name.");
      return;
    }
    const err = mode === "login" ? signIn(email, password) : signUp(name.trim(), email, password, referral);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    toast.success(mode === "login" ? "Welcome back to win1" : "Vault created — 500 credits granted");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neon-panel sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl neon-text">
            {mode === "login" ? "Access Vault" : "Create Vault"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Sign in to sync your score balance and top-ups."
              : `New operators receive a ${settings.signupBonus}-credit welcome bonus.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Operator name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
            </div>
          )}
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="referral">Referral code (optional)</Label>
              <Input
                id="referral"
                value={referral}
                placeholder="WIN1ABCDE"
                onChange={(e) => setReferral(e.target.value.toUpperCase())}
                maxLength={12}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={64}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full font-display tracking-wide">
            {mode === "login" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        <div className="flex items-center justify-between gap-3 pt-1 text-sm">
          <button
            type="button"
            className="text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setError(null);
              setMode(mode === "login" ? "signup" : "login");
            }}
          >
            {mode === "login" ? "Need an account? Sign up" : "Already registered? Sign in"}
          </button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              playAsGuest();
              toast.info("Guest mode — 250 demo credits");
              onOpenChange(false);
            }}
          >
            Guest mode
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
