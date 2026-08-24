
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
  Sparkles,
  Zap,
  Layers,
  Bomb,
  Plane,
  Disc,
  ChevronLeft,
  RotateCcw,
  Trophy,
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
import { useVaultRequests } from "@/lib/use-vault-requests";
import { ReferEarn } from "@/components/refer-earn";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "win1 — Cyberpunk Gaming & Reward Vault" },
      {
        name: "description",
        content:
          "win1 is a neon cyberpunk reward vault: spin reels, crash aviator, sweep mines and play roulette.",
      },
    ],
  }),
  component: Index,
});

/* --- ROULETTE WHEEL COMPONENT --- */
const ROULETTE_NUMBERS = [
  { num: 0, color: "green" },
  { num: 32, color: "red" },
  { num: 15, color: "black" },
  { num: 19, color: "red" },
  { num: 4, color: "black" },
  { num: 21, color: "red" },
  { num: 2, color: "black" },
  { num: 25, color: "red" },
  { num: 17, color: "black" },
  { num: 34, color: "red" },
  { num: 6, color: "black" },
  { num: 27, color: "red" },
  { num: 13, color: "black" },
  { num: 36, color: "red" },
  { num: 11, color: "black" },
  { num: 30, color: "red" },
  { num: 8, color: "black" },
  { num: 23, color: "red" },
  { num: 10, color: "black" },
  { num: 5, color: "red" },
  { num: 24, color: "black" },
  { num: 16, color: "red" },
  { num: 33, color: "black" },
  { num: 1, color: "red" },
  { num: 20, color: "black" },
  { num: 14, color: "red" },
  { num: 31, color: "black" },
  { num: 9, color: "red" },
  { num: 22, color: "black" },
  { num: 18, color: "red" },
  { num: 29, color: "black" },
  { num: 7, color: "red" },
  { num: 28, color: "black" },
  { num: 12, color: "red" },
  { num: 35, color: "black" },
  { num: 3, color: "red" },
  { num: 26, color: "black" },
];

function NeonRoulette() {
  const { user, updateBalance } = useVault();
  const [betAmount, setBetAmount] = useState<number>(20);
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<{ num: number; color: string } | null>(null);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const handleSpin = () => {
    if (!selectedBet) {
      alert("Please select a bet (Red, Black, Green, Even, or Odd) first!");
      return;
    }
    const currentBalance = user?.balance || 0;
    if (currentBalance < betAmount) {
      alert("Insufficient score balance. Please deposit!");
      return;
    }

    if (typeof updateBalance === "function") {
      updateBalance(-betAmount);
    }

    setSpinning(true);
    setWinMessage(null);

    const randomIndex = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
    const degreesPerSlice = 360 / ROULETTE_NUMBERS.length;
    const targetDegree = 360 * 5 + randomIndex * degreesPerSlice;
    setRotation((prev) => prev + targetDegree);

    setTimeout(() => {
      const outcome = ROULETTE_NUMBERS[randomIndex];
      setLastResult(outcome);
      setSpinning(false);

      let won = false;
      let multiplier = 0;

      if (selectedBet === "red" && outcome.color === "red") {
        won = true;
        multiplier = 2;
      } else if (selectedBet === "black" && outcome.color === "black") {
        won = true;
        multiplier = 2;
      } else if (selectedBet === "green" && outcome.color === "green") {
        won = true;
        multiplier = 14;
      } else if (selectedBet === "even" && outcome.num !== 0 && outcome.num % 2 === 0) {
        won = true;
        multiplier = 2;
      } else if (selectedBet === "odd" && outcome.num % 2 !== 0) {
        won = true;
        multiplier = 2;
      }

      if (won) {
        const winAmount = betAmount * multiplier;
        if (typeof updateBalance === "function") {
          updateBalance(winAmount);
        }
        setWinMessage(`Won +₹${winAmount}! (${multiplier}x payout)`);
      } else {
        setWinMessage(`Landed on ${outcome.num} (${outcome.color.toUpperCase()}). Try again!`);
      }
    }, 3500);
  };

  return (
    <div className="neon-panel rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl neon-text flex items-center gap-2">
            <Disc className="size-6 text-primary" /> Neon Roulette Wheel
          </h2>
          <p className="text-xs text-muted-foreground">Pick a color or condition, spin and claim up to 14x rewards.</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center my-6">
        <div className="relative flex items-center justify-center size-56 sm:size-64 rounded-full border-4 border-primary/40 bg-background/90 shadow-[0_0_30px_rgba(0,255,200,0.15)] overflow-hidden">
          <div
            className="w-full h-full rounded-full transition-transform duration-[3500ms] ease-out flex items-center justify-center"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div className="absolute inset-2 rounded-full border border-dashed border-primary/30 flex items-center justify-center">
              <Sparkles className="size-10 text-primary/40" />
            </div>
          </div>

          <div className="absolute z-10 flex flex-col items-center justify-center size-24 rounded-full border border-border bg-secondary/90 shadow-lg text-center">
            {lastResult ? (
              <>
                <span
                  className={`text-2xl font-bold font-display ${
                    lastResult.color === "red"
                      ? "text-rose-400"
                      : lastResult.color === "black"
                      ? "text-slate-300"
                      : "text-emerald-400"
                  }`}
                >
                  {lastResult.num}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {lastResult.color}
                </span>
              </>
            ) : (
              <span className="text-xs font-display text-muted-foreground">SPIN</span>
            )}
          </div>
        </div>

        {winMessage && (
          <div className="mt-4 flex items-center gap-2 text-sm font-display font-semibold text-primary animate-bounce">
            <Trophy className="size-4" /> {winMessage}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">1. Choose Bet Type</div>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <Button
            type="button"
            variant={selectedBet === "red" ? "default" : "secondary"}
            onClick={() => setSelectedBet("red")}
            className="border-rose-500/50 hover:bg-rose-500/20 text-rose-300 font-display font-bold"
          >
            RED (2x)
          </Button>
          <Button
            type="button"
            variant={selectedBet === "black" ? "default" : "secondary"}
            onClick={() => setSelectedBet("black")}
            className="border-slate-500/50 hover:bg-slate-500/20 text-slate-300 font-display font-bold"
          >
            BLACK (2x)
          </Button>
          <Button
            type="button"
            variant={selectedBet === "green" ? "default" : "secondary"}
            onClick={() => setSelectedBet("green")}
            className="border-emerald-500/50 hover:bg-emerald-500/20 text-emerald-300 font-display font-bold"
          >
            GREEN (14x)
          </Button>
          <Button
            type="button"
            variant={selectedBet === "even" ? "default" : "secondary"}
            onClick={() => setSelectedBet("even")}
            className="font-display font-bold"
          >
            EVEN (2x)
          </Button>
          <Button
            type="button"
            variant={selectedBet === "odd" ? "default" : "secondary"}
            onClick={() => setSelectedBet("odd")}
            className="font-display font-bold"
          >
            ODD (2x)
          </Button>
        </div>

        <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground pt-2">2. Bet Amount</div>
        <div className="flex flex-wrap items-center gap-2">
          {[10, 20, 50, 100, 500].map((amt) => (
            <Button
              key={amt}
              size="sm"
              variant={betAmount === amt ? "default" : "outline"}
              onClick={() => setBetAmount(amt)}
              className="font-display"
            >
              ₹{amt}
            </Button>
          ))}
        </div>

        <Button
          onClick={handleSpin}
          disabled={spinning}
          className="w-full mt-4 py-6 text-lg font-display tracking-widest uppercase font-bold"
        >
          {spinning ? (
            <span className="flex items-center gap-2">
              <RotateCcw className="size-5 animate-spin" /> Wheel Spinning...
            </span>
          ) : (
            `Spin for ₹${betAmount}`
          )}
        </Button>
      </div>
    </div>
  );
}

/* --- GAMES CONFIG --- */
const GAMES = [
  {
    id: "roulette",
    name: "Neon Roulette",
    tagline: "Red, Black & 14x Green Wheel",
    badge: "NEW",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: Disc,
    players: "1,890 Playing",
    gradient: "from-purple-500/20 via-primary/10 to-transparent",
  },
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
  const pending = requests?.filter((r) => r.status === "pending")?.length || 0;

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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      {activeTab === "roulette" && <NeonRoulette />}
      {activeTab === "reels" && <ReelGame />}
      {activeTab === "cards" && <CardGame />}
      {activeTab === "aviator" && <AviatorGame />}
      {activeTab === "mines" && <MinesGame />}
      {activeTab === "wallet" && <WalletView onDeposit={openDeposit} onWithdraw={openWithdraw} />}
      {activeTab === "refer" && <ReferEarn onSignIn={() => setMobileAuthOpen(true)} />}

      {/* Admin Panel Access */}
      {isOperator ? (
        <div className="neon-panel mt-
              
