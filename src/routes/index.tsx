
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
  component: Index,
});

const ROULETTE_NUMS = [
  { num: 0, color: "green" }, { num: 32, color: "red" }, { num: 15, color: "black" },
  { num: 19, color: "red" }, { num: 4, color: "black" }, { num: 21, color: "red" },
  { num: 2, color: "black" }, { num: 25, color: "red" }, { num: 17, color: "black" },
  { num: 34, color: "red" }, { num: 6, color: "black" }, { num: 27, color: "red" },
  { num: 13, color: "black" }, { num: 36, color: "red" }, { num: 11, color: "black" },
  { num: 30, color: "red" }, { num: 8, color: "black" }, { num: 23, color: "red" },
  { num: 10, color: "black" }, { num: 5, color: "red" }, { num: 24, color: "black" }
];

function NeonRoulette() {
  const { user, updateBalance } = useVault();
  const [betAmount, setBetAmount] = useState<number>(20);
  const [selectedBet, setSelectedBet] = useState<string>("red");
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<{ num: number; color: string } | null>(null);
  const [winMsg, setWinMsg] = useState<string | null>(null);
  const [rot, setRot] = useState(0);

  const handleSpin = () => {
    if ((user?.balance || 0) < betAmount) {
      alert("Insufficient score balance! Please deposit.");
      return;
    }
    if (typeof updateBalance === "function") {
      updateBalance(-betAmount);
    }

    setSpinning(true);
    setWinMsg(null);
    const idx = Math.floor(Math.random() * ROULETTE_NUMS.length);
    setRot((prev) => prev + 1800 + idx * (360 / ROULETTE_NUMS.length));

    setTimeout(() => {
      const out = ROULETTE_NUMS[idx];
      setLastResult(out);
      setSpinning(false);
      let won = false;
      let mult = 2;
      if (selectedBet === out.color) {
        won = true;
        if (out.color === "green") mult = 14;
      }
      if (won) {
        const amt = betAmount * mult;
        if (typeof updateBalance === "function") updateBalance(amt);
        setWinMsg(`Won +₹${amt}! (${mult}x payout)`);
      } else {
        setWinMsg(`Landed on ${out.num} ${out.color.toUpperCase()}`);
      }
    }, 3000);
  };

  return (
    <div className="neon-panel rounded-xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl neon-text flex items-center gap-2">
            <Disc className="size-6 text-primary" /> Neon Roulette Wheel
          </h2>
          <p className="text-xs text-muted-foreground">Select color &amp; spin up to 14x multipliers.</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center my-6">
        <div className="relative flex items-center justify-center size-56 rounded-full border-4 border-primary/40 bg-background/90 shadow-xl overflow-hidden">
          <div
            className="w-full h-full rounded-full transition-transform duration-[3000ms] ease-out flex items-center justify-center"
            style={{ transform: `rotate(${rot}deg)` }}
          >
            <Sparkles className="size-12 text-primary/30 animate-pulse" />
          </div>
          <div className="absolute z-10 flex flex-col items-center justify-center size-24 rounded-full border border-border bg-secondary/90 shadow-md">
            {lastResult ? (
              <span className={`text-2xl font-bold font-display ${lastResult.color === "red" ? "text-rose-400" : lastResult.color === "black" ? "text-slate-300" : "text-emerald-400"}`}>
                {lastResult.num}
              </span>
            ) : (
              <span className="text-xs font-display text-muted-foreground">SPIN</span>
            )}
          </div>
        </div>
        {winMsg && (
          <div className="mt-3 text-sm font-display font-bold text-primary flex items-center gap-1 animate-bounce">
            <Trophy className="size-4"/>{winMsg}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">1. Choose Color</div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={selectedBet === "red" ? "default" : "secondary"}
            onClick={() => setSelectedBet("red")}
            className="font-display font-bold text-rose-300"
          >
            RED (2x)
          </Button>
          <Button
            type="button"
            variant={selectedBet === "black" ? "default" : "secondary"}
            onClick={() => setSelectedBet("black")}
            className="font-display font-bold text-slate-300"
          >
            BLACK (2x)
          </Button>
          <Button
            type="button"
            variant={selectedBet === "green" ? "default" : "secondary"}
            onClick={() => setSelectedBet("green")}
            className="font-display font-bold text-emerald-300"
          >
            GREEN (14x)
          </Button>
        </div>

        <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">2. Bet Amount</div>
        <div className="flex flex-wrap gap-2">
          {[10, 20, 50, 100, 500].map((a) => (
            <Button
              key={a}
              size="sm"
              variant={betAmount === a ? "default" : "outline"}
              onClick={() => setBetAmount(a)}
              className="font-display"
            >
              ₹{a}
            </Button>
          ))}
        </div>

        <Button
          onClick={handleSpin}
          disabled={spinning}
          className="w-full py-6 text-base font-display font-bold tracking-widest uppercase mt-2"
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
  const [activeTab, setActiveTab] = useState("lobby");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [mobileAuthOpen, setMobileAuthOpen] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [activeUserMobile, setActiveUserMobile] = useState<string | null>(null);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("win1_user_phone");
    if (saved) {
      setActiveUserMobile(saved);
    } else if (!user && typeof signInAsGuest === "function") {
      signInAsGuest();
    }
  }, [user, signInAsGuest]);

  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = mobileNumber.replace(/\D/g, "");
    if (clean.length !== 10) {
      alert("Please enter a valid 10-digit number");
      return;
    }
    localStorage.setItem("win1_user_phone", clean);
    setActiveUserMobile(clean);
    setMobileAuthOpen(false);
  };

  const isOperator = isAdminUnlocked || (!!user && !user.guest && user.email === ADMIN_EMAIL);
  const pending = requests?.filter((r) => r.status === "pending")?.length || 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 pb-16 pt-6">
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
          <Button onClick={() => setTopUpOpen(true)} className="font-display tracking-wide">
            <ArrowDownToLine className="size-4" /> Deposit
          </Button>
          <Button
            variant="secondary"
            onClick={() => (activeUserMobile ? setWithdrawOpen(true) : setMobileAuthOpen(true))}
            className="font-display tracking-wide"
          >
            <ArrowUpFromLine className="size-4" /> Withdraw
          </Button>
          <Button variant="ghost" asChild>
            <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" /> Support
            </a>
          </Button>
          {activeUserMobile ? (
            <Button
              variant="ghost"
              onClick={() => {
                localStorage.removeItem("win1_user_phone");
                setActiveUserMobile(null);
                if (signOut) signOut();
              }}
              aria-label="Sign out"
            >
              <LogOut className="size-4" /> Sign out
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setMobileAuthOpen(true)}>
              <LogIn className="size-4" /> Sign in
            </Button>
          )}
        </div>
      </header>

      <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {activeUserMobile ? (
            <>Logged in: <span className="font-bold text-foreground">+91 {activeUserMobile}</span></>
          ) : (
            <>Playing as <span className="text-foreground">Guest Player</span></>
          )}
          {isOperator && " · Operator Mode"}
        </p>

        {activeTab !== "lobby" && (
          <Button variant="outline" size="sm" onClick={() => setActiveTab("lobby")} className="flex items-center gap-1 font-display">
            <ChevronLeft className="size-4" /> Back to Lobby
          </Button>
        )}
      </div>

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

      {activeTab === "roulette" && <NeonRoulette />}
      {activeTab === "reels" && <ReelGame />}
      {activeTab === "cards" && <CardGame />}
      {activeTab === "aviator" && <AviatorGame />}
      {activeTab === "mines" && <MinesGame />}
      {activeTab === "wallet" && (
        <WalletView onDeposit={() => setTopUpOpen(true)} onWithdraw={() => setWithdrawOpen(true)} />
      )}
      {activeTab === "refer" && <ReferEarn onSignIn={() => setMobileAuthOpen(true)} />}

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

      <div className="neon-panel mt-8 rounded-xl p-5">
        <h2 className="font-display text-xl neon-text">Help &amp; Support</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Need quick support with deposit or withdrawals? Contact us directly.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild className="font-display tracking-wide">
            <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" /> WhatsApp Customer Support
            </a>
          </Button>
          {!isOperator && (
            <Button
              variant="ghost"
              onClick={() => {
                const pin = window.prompt("Enter Admin Secret PIN:");
                if (pin === "789012") setIsAdminUnlocked(true);
                else if (pin !== null) alert("Invalid PIN");
              }}
              className="text-xs text-muted-foreground"
            >
              Operator Portal
            </Button>
          )}
        </div>
      </div>

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
  
  
                  
            
