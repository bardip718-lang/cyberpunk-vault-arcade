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
  KeyRound,
  ExternalLink,
  Flame,
  LayoutGrid,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReelGame } from "@/components/reel-game";
import { CardGame } from "@/components/card-game";
import { RouletteGame } from "@/components/roulette-game";
import { AdminConsole } from "@/components/admin-console";
import { TopUpModal } from "@/components/topup-modal";
import { WithdrawModal } from "@/components/withdraw-modal";
import { WalletView } from "@/components/wallet-view";
import { AviatorGame } from "@/components/aviator-game";
import { MinesGame } from "@/components/mines-game";
import { DailySpinModal } from "@/components/daily-spin-modal";
import { FortuneGemsGame } from "@/components/fortune-gems-game";
import { ProfileModal } from "@/components/profile-modal";
import { SUPPORT_WHATSAPP } from "@/lib/notify";
import { useVault, ADMIN_EMAIL } from "@/lib/vault-store";
import { useVaultRequests } from "@/lib/use-vault-requests";
import { useSettleOwnRequests } from "@/lib/use-settle-requests";
import { ReferEarn } from "@/components/refer-earn";
import { toast } from "sonner";

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

type GameCategory = "all" | "slots" | "crash" | "instant";

const GAMES = [
  {
    id: "fortunegems",
    category: "slots",
    name: "Fortune Gems 2",
    tagline: "3 Reels + 15x Multiplier Special Reel",
    badge: "HOT",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: Flame,
    players: "2,350 Playing",
    gradient: "from-amber-500/20 via-primary/10 to-transparent",
  },
  {
    id: "aviator",
    category: "crash",
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
    category: "instant",
    name: "Cyber Mines",
    tagline: "Uncover Gems & Avoid the Traps",
    badge: "POPULAR",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: Bomb,
    players: "980 Playing",
    gradient: "from-emerald-500/20 via-primary/10 to-transparent",
  },
  {
    id: "roulette",
    category: "instant",
    name: "Neon Roulette",
    tagline: "Red, Black & 14x Green Wheel",
    badge: "NEW",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: Disc,
    players: "1,890 Playing",
    gradient: "from-purple-500/20 via-primary/10 to-transparent",
  },
  {
    id: "reels",
    category: "slots",
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
    category: "instant",
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
  const { user, signOut, playAsGuest } = useVault();
  const { requests } = useVaultRequests();
  useSettleOwnRequests();

  const [activeTab, setActiveTab] = useState<string>("lobby");
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>("all");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [dailySpinOpen, setDailySpinOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileAuthOpen, setMobileAuthOpen] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [activeUserMobile, setActiveUserMobile] = useState<string | null>(null);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  const [jackpotAmount, setJackpotAmount] = useState(1101901);

  useEffect(() => {
    const timer = setInterval(() => {
      setJackpotAmount((prev) => prev + Math.floor(Math.random() * 5) + 1);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [secretCode, setSecretCode] = useState<string>("");
  const [enteredOtp, setEnteredOtp] = useState<string>("");

  useEffect(() => {
    const savedPhone = localStorage.getItem("win1_user_phone");
    if (savedPhone) {
      setActiveUserMobile(savedPhone);
    } else if (!user) {
      playAsGuest();
    }
  }, [user, playAsGuest]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = mobileNumber.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      toast.error("Please enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.");
      return;
    }

    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setSecretCode(randomOtp);
    sessionStorage.setItem("win1_pending_otp", randomOtp);
    sessionStorage.setItem("win1_pending_phone", cleanNumber);
    setStep("otp");

    const adminPhone = "918317848513";
    const waText = encodeURIComponent(
      `Hi Admin, please verify my Win1 account.\nPhone: +91${cleanNumber}\nVerification Code: ${randomOtp}`
    );
    window.open(`https://wa.me/${adminPhone}?text=${waText}`, "_blank");
    toast.success("WhatsApp opened. Send the verification message to Admin!");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const savedOtp = secretCode || sessionStorage.getItem("win1_pending_otp");
    const targetPhone =
      mobileNumber.replace(/\D/g, "") || sessionStorage.getItem("win1_pending_phone") || "";

    if (!savedOtp || enteredOtp.trim() !== savedOtp.trim()) {
      toast.error("Incorrect verification code! Please check the code sent to WhatsApp.");
      return;
    }

    localStorage.setItem("win1_user_phone", targetPhone);
    setActiveUserMobile(targetPhone);
    sessionStorage.removeItem("win1_pending_otp");
    sessionStorage.removeItem("win1_pending_phone");
    setMobileAuthOpen(false);
    setStep("phone");
    setEnteredOtp("");
    setSecretCode("");
    toast.success("Mobile number verified successfully!");
  };

  const handleLogout = () => {
    localStorage.removeItem("win1_user_phone");
    setActiveUserMobile(null);
    if (signOut) signOut();
  };

  const isOperator = isAdminUnlocked || (!!user && !user.guest && user.email === ADMIN_EMAIL);
  const pending = requests ? requests.filter((r) => r.status === "pending").length : 0;
  const isLoggedIn = !!activeUserMobile || (!!user && !user.guest);

  const openDeposit = () => {
    if (!isLoggedIn) {
      setMobileAuthOpen(true);
      return;
    }
    setTopUpOpen(true);
  };

  const openWithdraw = () => {
    if (!isLoggedIn) {
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

  const filteredGames = GAMES.filter((g) =>
    selectedCategory === "all" ? true : g.category === selectedCategory
  );

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
          <Button onClick={openDeposit} className="font-display tracking-wide">
            <ArrowDownToLine className="size-4" /> Deposit
          </Button>
          <Button variant="secondary" onClick={openWithdraw} className="font-display tracking-wide">
            <ArrowUpFromLine className="size-4" /> Withdraw
          </Button>
          <Button
            variant="outline"
            onClick={() => setProfileOpen(true)}
            className="border-primary/50 font-display tracking-wide"
          >
            <UserIcon className="size-4 text-primary" /> Profile
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
            <Button variant="ghost" onClick={() => { setStep("phone"); setMobileAuthOpen(true); }}>
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

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={activeTab === "lobby" ? "default" : "secondary"}
          onClick={() => setActiveTab("lobby")}
          className="font-display text-sm"
        >
          <Gamepad2 className="mr-2 size-4" /> Game Lobby
        </Button>
        <Button
          variant="outline"
          onClick={() => setDailySpinOpen(true)}
          className="font-display text-sm border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
        >
          <Sparkles className="mr-2 size-4 animate-spin" /> Daily Spin
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
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-background to-cyan-950/40 p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                    Grand Cyber Jackpot • Live
                  </span>
                </div>
                <h2 className="mt-1 font-display text-3xl font-black tracking-tight text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                  ₹{jackpotAmount.toLocaleString("en-IN")}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Draw updates live in real-time across all platform games.
                </p>
              </div>

              <Button
                onClick={() => setDailySpinOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 font-display font-bold uppercase tracking-wider text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 transition-all"
              >
                <Flame className="mr-1.5 size-4 fill-slate-950" /> Free Daily Spin
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Button
              size="sm"
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className="h-9 px-4 font-display text-xs tracking-wider"
            >
              <LayoutGrid className="mr-1.5 size-3.5" /> All Games
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === "slots" ? "default" : "outline"}
              onClick={() => setSelectedCategory("slots")}
              className="h-9 px-4 font-display text-xs tracking-wider"
            >
              <Flame className="mr-1.5 size-3.5 text-amber-400" /> Slots (777)
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === "crash" ? "default" : "outline"}
              onClick={() => setSelectedCategory("crash")}
              className="h-9 px-4 font-display text-xs tracking-wider"
            >
              <Plane className="mr-1.5 size-3.5 text-rose-400" /> Crash Games
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === "instant" ? "default" : "outline"}
              onClick={() => setSelectedCategory("instant")}
              className="h-9 px-4 font-display text-xs tracking-wider"
            >
              <Zap className="mr-1.5 size-3.5 text-cyan-400" /> Instant Win
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGames.map((g) => {
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

      {activeTab === "fortunegems" && <FortuneGemsGame />}
      {activeTab === "roulette" && <RouletteGame />}
      {activeTab === "reels" && <ReelGame />}
      {activeTab === "cards" && <CardGame />}
      {activeTab === "aviator" && <AviatorGame />}
      {activeTab === "mines" && <MinesGame />}
      {activeTab === "wallet" && <WalletView onDeposit={openDeposit} onWithdraw={openWithdraw} />}
      {activeTab === "refer" && <ReferEarn onSignIn={() => { setStep("phone"); setMobileAuthOpen(true); }} />}

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

      {mobileAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="neon-panel w-full max-w-md rounded-xl p-6 shadow-2xl border border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              {step === "phone" ? (
                <Phone className="size-5 text-primary" />
              ) : (
                <KeyRound className="size-5 text-primary" />
              )}
              <h2 className="font-display text-xl neon-text">
                {step === "phone" ? "Mobile Verification" : "Enter Verification OTP"}
              </h2>
            </div>

            {step === "phone" ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your real 10-digit mobile number. Verification via WhatsApp is required.
                </p>
                <form onSubmit={handleSendOtp} className="space-y-4">
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
                      Verify on WhatsApp <ExternalLink className="ml-1 size-3.5" />
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
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  Verification message sent to Admin for <strong>+91 {mobileNumber}</strong>. Enter the 4-digit code provided by Admin:
                </p>
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Enter 4-Digit OTP"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    className="w-full text-center tracking-widest text-xl font-mono py-2 rounded-lg border border-border bg-background/80 outline-none text-foreground"
                    autoFocus
                    required
                  />
                  <div className="flex gap-2">
                    <Button type="submit" className="w-full font-display">
                      Verify &amp; Sign In
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setStep("phone")}
                    >
                      Back
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <TopUpModal isOpen={topUpOpen} onClose={() => setTopUpOpen(false)} />
      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
      <DailySpinModal open={dailySpinOpen} onOpenChange={setDailySpinOpen} />
      <ProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onDeposit={openDeposit}
        onWithdraw={openWithdraw}
      />
    </main>
  );
}
