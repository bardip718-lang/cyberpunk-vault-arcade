        import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Gamepad2,
  LogIn,
  LogOut,
  ShieldCheck,
  Wallet,
  MessageCircle,
  Gift,
  Phone,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ReelGame } from "@/components/reel-game";
import { CardGame } from "@/components/card-game";
import { AdminConsole } from "@/components/admin-console";
import { TopUpModal } from "@/components/topup-modal";
import { WithdrawModal } from "@/components/withdraw-modal";
import { WalletView } from "@/components/wallet-view";
import { AviatorGame } from "@/components/aviator-game";
import { MinesGame } from "@/components/mines-game";
import { SUPPORT_WHATSAPP } from "@/lib/notify";
import { useVault, ADMIN_EMAIL } from "@/lib/vault-store";
import { useVaultRequests, useRequestBalanceSync } from "@/lib/use-vault-requests";
import { ReferEarn } from "@/components/refer-earn";
import { useReferralBonusSync } from "@/lib/use-referral";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "win1 — Cyberpunk Gaming & Reward Vault" },
      {
        name: "description",
        content:
          "win1 is a neon cyberpunk reward vault: spin the 3x5 reels, clear the data-match grid, top up by UPI and track credits.",
      },
      { property: "og:title", content: "win1 — Cyberpunk Gaming & Reward Vault" },
      {
        property: "og:description",
        content: "Spin neon reels, match data cards, and manage your credit vault in win1.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, signOut, signInAsGuest } = useVault();
  const { requests } = useVaultRequests();
  useRequestBalanceSync();
  useReferralBonusSync();

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [mobileAuthOpen, setMobileAuthOpen] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [activeUserMobile, setActiveUserMobile] = useState<string | null>(null);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // Auto load guest session or saved phone session
  useEffect(() => {
    const savedPhone = localStorage.getItem("win1_user_phone");
    if (savedPhone) {
      setActiveUserMobile(savedPhone);
    } else if (!user && typeof signInAsGuest === "function") {
      signInAsGuest();
    }
  }, [user, signInAsGuest]);

  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = mobileNumber.replace(/\D/g, "");
    if (cleanNumber.length !== 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
    localStorage.setItem("win1_user_phone", cleanNumber);
    setActiveUserMobile(cleanNumber);
    setMobileAuthOpen(false);
    alert("Logged in successfully with +91 " + cleanNumber);
  };

  const handleLogout = () => {
    localStorage.removeItem("win1_user_phone");
    setActiveUserMobile(null);
    if (signOut) signOut();
  };

  const isOperator = isAdminUnlocked || (!!user && !user.guest && user.email === ADMIN_EMAIL);
  const pending = requests.filter((r) => r.status === "pending").length;

  const openDeposit = () => setTopUpOpen(true);
  const openWithdraw = () => {
    if (!activeUserMobile) {
      setMobileAuthOpen(true);
      return;
    }
    setWithdrawOpen(true);
  };

  const handleAdminAccess = () => {
    if (isAdminUnlocked) return;
    const pin = window.prompt("Enter Admin Secret PIN:");
    if (pin === "789012") {
      setIsAdminUnlocked(true);
    } else if (pin !== null) {
      alert("Invalid Security PIN");
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-16 pt-6">
      <header className="neon-panel mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl p-4">
        <div>
          <h1 className="font-display text-3xl neon-text">win1</h1>
          <p className="text-sm text-muted-foreground">Gaming &amp; Reward Vault</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-border bg-background/60 px-4 py-2 text-right">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Score balance</p>
            <p className="font-display text-xl text-primary">{user ? user.balance : 0}</p>
          </div>
          <Button onClick={openDeposit} className="font-display tracking-wide">
            <ArrowDownToLine className="size-4" /> Deposit
          </Button>
          <Button variant="secondary" onClick={openWithdraw} className="font-display tracking-wide">
            <ArrowUpFromLine className="size-4" /> Withdraw
          </Button>
          <Button variant="ghost" asChild>
            <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" /> Support
            </a>
          </Button>
          {activeUserMobile ? (
            <Button variant="ghost" onClick={handleLogout} aria-label="Sign out">
              <LogOut className="size-4" /> Sign out
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setMobileAuthOpen(true)}>
              <LogIn className="size-4" /> Sign in
            </Button>
          )}
        </div>
      </header>

      {/* Status Bar */}
      <p className="mb-4 text-sm text-muted-foreground">
        {activeUserMobile ? (
          <>
            Logged in: <span className="font-bold text-foreground">+91 {activeUserMobile}</span>
          </>
        ) : (
          <>Playing as <span className="text-foreground">Guest Player</span> (Instant 1-Tap Play)</>
        )}
        {isOperator && " · Operator"}
      </p>

      {/* Mobile Login Modal */}
      {mobileAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="neon-panel w-full max-w-md rounded-xl p-6 shadow-2xl border border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="size-5 text-primary" />
              <h2 className="font-display text-xl neon-text">Mobile Sign In / Sign Up</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your 10-digit mobile number for instant play and fast withdrawals. No password or email needed.
            </p>
            <form onSubmit={handlePhoneLogin} className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background/80 px-3 py-2">
                <span className="font-display text-sm text-muted-foreground">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Enter 10-digit Mobile Number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-transparent font-display outline-none text-foreground"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="w-full font-display">
                  Continue &amp; Play
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setMobileAuthOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Tabs defaultValue="reels">
        <TabsList className="mb-5 grid w-full grid-cols-6 bg-secondary/60">
          <TabsTrigger value="reels">
            <Gamepad2 className="mr-1 size-4" /> Reels
          </TabsTrigger>
          <TabsTrigger value="cards">Data Match</TabsTrigger>
          <TabsTrigger value="aviator">Aviator</TabsTrigger>
          <TabsTrigger value="mines">Mines</TabsTrigger>
          <TabsTrigger value="wallet">
            <Wallet className="mr-1 size-4" /> Wallet
          </TabsTrigger>
          <TabsTrigger value="refer">
            <Gift className="mr-1 size-4" /> Refer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reels">
          <ReelGame />
        </TabsContent>
        <TabsContent value="cards">
          <CardGame />
        </TabsContent>
        <TabsContent value="aviator">
          <AviatorGame />
        </TabsContent>
        <TabsContent value="mines">
          <MinesGame />
        </TabsContent>
        <TabsContent value="wallet">
          <WalletView onDeposit={openDeposit} onWithdraw={openWithdraw} />
        </TabsContent>
        <TabsContent value="refer">
          <ReferEarn onSignIn={() => setMobileAuthOpen(true)} />
        </TabsContent>
      </Tabs>

      {/* Admin Panel Access */}
      {isOperator ? (
        <div className="neon-panel mt-8 rounded-xl p-5 border border-primary/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl neon-text flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" /> Admin Operator Console
            </h2>
            {pending > 0 && (
              <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded font-bold">
                {pending} Pending Request(s)
              </span>
            )}
          </div>
          <AdminConsole />
        </div>
      ) : null}

      <div className="neon-panel mt-8 rounded-xl p-5">
        <h2 className="font-display text-xl neon-text">Help &amp; Support</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Payment stuck, UTR not matched or withdrawal delayed? Talk to a human operator on WhatsApp.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild className="font-display tracking-wide">
            <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" /> WhatsApp Customer Support
            </a>
          </Button>
          {!isOperator && (
            <Button variant="ghost" onClick={handleAdminAccess} className="text-xs text-muted-foreground">
              Operator Portal
            </Button>
          )}
        </div>
      </div>

      <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />
      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </main>
  );
            }
              
