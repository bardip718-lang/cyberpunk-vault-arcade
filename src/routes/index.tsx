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
  Flame,
  Sparkles,
  Zap,
  Layers,
  Bomb,
  Plane,
  ChevronLeft,
} from "lucide-react";
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
          "win1 is a neon cyberpunk reward vault: spin reels, crash aviator, sweep mines and top up by UPI.",
      },
    ],
  }),
  component: Index,
});

const GAMES = [
  {
    id: "aviator",
    name: "Aviator Crash",
    tagline: "High Multiplier Real-Time Cashout",
    badge: "HOT",
    badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: Plane,
    players: "1,420 Playing",
    gradient: "from-rose-500/20 via-primary/10 to-transparent",
  },
  {
    id: "mines",
    name: "Cyber Mines",
    tagline: "Uncover Gems & Avoid the Traps",
    badge: "POPULAR",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: Bomb,
    players: "980 Playing",
    gradient: "from-emerald-500/20 via-primary/10 to-transparent",
  },
  {
    id: "reels",
    name: "Neon Reels 3x5",
    tagline: "Classic Vegas Multi-Line Slot",
    badge: "CLASSIC",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: Zap,
    players: "750 Playing",
    gradient: "from-amber-500/20 via-primary/10 to-transparent",
  },
  {
    id: "cards",
    name: "Data Match Matrix",
    tagline: "Cyberpunk Memory & Card Grid",
    badge: "SKILL",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    icon: Layers,
    players: "410 Playing",
    gradient: "from-cyan-500/20 via-primary/10 to-transparent",
  },
];

function Index() {
  const { user, signOut, signInAsGuest } = useVault();
  const { requests } = useVaultRequests();
  useRequestBalanceSync();
  useReferralBonusSync();

  const [activeTab, setActiveTab] = useState<string>("lobby");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [mobileAuthOpen, setMobileAuthOpen] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [activeUserMobile, setActiveUserMobile] = useState<string | null>(null);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

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
      {/* Top Header */}
      <header className="neon-panel mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl p-4">
        <div className="cursor-pointer" onClick={() => setActiveTab("lobby")}>
          <h1 className="font-display text-3xl neon-text">win1</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Arcade Gaming &amp; Vault</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-border bg-background/60 px-4 py-2 text-right">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Score Balance</p>
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

      {/* User Info Bar */}
      <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {activeUserMobile ? (
            <>Logged in: <span className="font-bold text-foreground">+91 {activeUserMobile}</span></>
          ) : (
            <>Playing as <span className="text-foreground">Guest Player</span> (1-Tap Play)</>
          )}
          {isOperator && " · Operator Mode"}
        </p>

        {activeTab !== "lobby" && (
          <Button variant="outline" size="sm" onClick={() => setActiveTab("lobby")} className="flex items-center gap-1 font-display">
            <ChevronLeft className="size-4" /> Back to Lobby
          </Button>
        )}
      </div>

      {/* Navigation Quick Bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={activeTab === "lobby" ? "default" : "secondary"}
          onClick={() => setActiveTab("lobby")}
          className="font-display text-sm"
        >
          <Gamepad2 className="mr-2 size-4" /> Game Lobby
        </Button>
        <Button
          variant={activeTab === "wallet" ? "default" : "secondary"}
          onClick={() => setActiveTab("wallet")}
          className="font-display text-sm"
        >
          <Wallet className="mr-2 size-4" /> Wallet
        </Button>
        <Button
          variant={activeTab === "refer" ? "default" : "secondary"}
          onClick={() => setActiveTab("refer")}
          className="font-display text-sm"
        >
          <Gift className="mr-2 size-4" /> Refer &amp; Earn
        </Button>
      </div>

      {/* VIEW: GAME LOBBY */}
      {activeTab === "lobby" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl neon-text flex items-center gap-2">
              <Sparkles className="size-5 text-primary" /> Popular Games
            </h2>
            <span className="text-xs text-muted-foreground">Select a game to start</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {GAMES.map((g) => {
              const IconComp = g.icon;
              return (
                <div
                  key={g.id}
                  onClick={() => setActiveTab(g.id)}
                  className={`neon-panel relative cursor-pointer overflow-hidden rounded-xl border border-border p-5 transition-all duration-200 hover:border-primary/60 hover:scale-[1.01] bg-gradient-to-br ${g.gradient}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-border bg-background/80 p-3 shadow-md">
                        <IconComp className="size-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold tracking-wide text-foreground">{g.name}</h3>
                        <p className="text-xs text-muted-foreground">{g.tagline}</p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${g.badgeColor}`}>
                      {g.badge}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {g.players}
                    </div>
                    <Button size="sm" className="font-display tracking-wider font-semibold">
                      Play Now
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: INDIVIDUAL GAMES */}
      {activeTab === "reels" && <ReelGame />}
      {activeTab === "cards" && <CardGame />}
      {activeTab === "aviator" && <AviatorGame />}
      {activeTab === "mines" && <MinesGame />}
      {activeTab === "wallet" && <WalletView onDeposit={openDeposit} onWithdraw={openWithdraw} />}
      {activeTab === "refer" && <ReferEarn onSignIn={() => setMobileAuthOpen(true)} />}

      {/* Admin Panel Access */}
      {isOperator ? (
        <div className="neon-panel mt-10 rounded-xl p-5 border border-primary/40">
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

      {/* Help Section */}
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

      <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />
      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </main>
  );
          }
              
