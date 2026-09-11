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
  Search,
  TrendingUp,
  History,
  Menu
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
      { title: "1win — Cyberpunk Gaming & Reward Vault" },
      {
        name: "description",
        content:
          "1win is a neon cyberpunk reward vault: spin reels, crash aviator, sweep mines and play roulette.",
      },
    ],
  }),
  component: Index,
});

type GameCategory = "all" | "slots" | "crash" | "instant";

const GAME_CARDS = [
  {
    id: "fortunegems",
    category: "slots",
    title: "FORTUNE GEMS 2",
    provider: "JILI GAMES",
    players: 892,
    badge: "TOP",
    gradient: "from-amber-500/30 via-orange-900/20 to-transparent",
    border: "border-amber-500/30",
    icon: Sparkles,
    color: "text-amber-400 animate-pulse drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]",
  },
  {
    id: "aviator",
    category: "crash",
    title: "AVIATOR",
    provider: "SPRIBE",
    players: 1467,
    badge: "HOT",
    gradient: "from-rose-600/30 via-red-900/20 to-transparent",
    border: "border-rose-500/30",
    icon: Plane,
    color: "text-rose-500 -rotate-12 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]",
  },
  {
    id: "mines",
    category: "instant",
    title: "MINES",
    provider: "1WIN GAMES",
    players: 614,
    badge: "EASY",
    gradient: "from-sky-600/30 via-blue-900/20 to-transparent",
    border: "border-sky-500/30",
    icon: Bomb,
    color: "text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]",
  },
  {
    id: "roulette",
    category: "instant",
    title: "ROULETTE",
    provider: "EVOLUTION",
    players: 1890,
    badge: "LIVE",
    gradient: "from-purple-600/30 via-purple-900/20 to-transparent",
    border: "border-purple-500/30",
    icon: Disc,
    color: "text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]",
  },
  {
    id: "reels",
    category: "slots",
    title: "NEON REELS",
    provider: "1WIN GAMES",
    players: 750,
    badge: "CLASSIC",
    gradient: "from-amber-600/30 via-yellow-900/20 to-transparent",
    border: "border-amber-500/30",
    icon: Zap,
    color: "text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]",
  },
  {
    id: "cards",
    category: "instant",
    title: "DATA MATCH",
    provider: "1WIN GAMES",
    players: 410,
    badge: "SKILL",
    gradient: "from-cyan-500/30 via-teal-900/20 to-transparent",
    border: "border-cyan-500/30",
    icon: Layers,
    color: "text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]",
  },
];

function Index() {
  const { user, signOut, playAsGuest } = useVault();
  const { requests } = useVaultRequests();
  useSettleOwnRequests();

  const [activeTab, setActiveTab] = useState<string>("lobby");
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>("all");
  const [search, setSearch] = useState<string>("");
  
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [dailySpinOpen, setDailySpinOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const [mobileAuthOpen, setMobileAuthOpen] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [activeUserMobile, setActiveUserMobile] = useState<string | null>(null);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  const [jackpotAmount, setJackpotAmount] = useState(1101901);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [secretCode, setSecretCode] = useState<string>("");
  const [enteredOtp, setEnteredOtp] = useState<string>("");

  useEffect(() => {
    const timer = setInterval(() => {
      setJackpotAmount((prev) => prev + Math.floor(Math.random() * 5) + 1);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

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
      toast.error("Please enter a valid 10-digit mobile number.");
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
    const targetPhone = mobileNumber.replace(/\D/g, "") || sessionStorage.getItem("win1_pending_phone") || "";

    if (!savedOtp || enteredOtp.trim() !== savedOtp.trim()) {
      toast.error("Incorrect verification code!");
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

  const filteredGames = GAME_CARDS.filter((g) => {
    const matchesCat = selectedCategory === "all" || g.category === selectedCategory;
    const matchesSearch = g.title.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#080b11] text-slate-100 font-sans px-3 pb-24 pt-3">
      
      {/* 1win Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4 sticky top-0 bg-[#080b11] z-40">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveTab("lobby")}>
          <span className="text-2xl font-black italic tracking-tighter text-blue-500">1win</span>
          <span className="text-[9px] bg-blue-600/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-bold">PRO</span>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              {/* Balance Box */}
              <div 
                onClick={() => setProfileOpen(true)}
                className="bg-[#101622] border border-slate-800 rounded-lg px-2.5 py-0.5 text-right cursor-pointer hover:border-slate-700"
              >
                <span className="text-[9px] text-slate-400 block -mb-1">BALANCE</span>
                <span className="text-[13px] font-black text-emerald-400">
                  ₹{user?.balance?.toLocaleString() || "0"}
                </span>
              </div>

              <button onClick={openDeposit} className="bg-emerald-600 p-1.5 rounded-lg text-white">
                <ArrowDownToLine className="size-4" />
              </button>
              <button onClick={() => setProfileOpen(true)} className="bg-[#151c2a] border border-slate-700 p-1.5 rounded-lg text-slate-300">
                <UserIcon className="size-4" />
              </button>
            </>
          ) : (
            <button onClick={() => { setStep("phone"); setMobileAuthOpen(true); }} className="bg-blue-600 text-white text-[11px] font-black px-3.5 py-2 rounded-lg shadow-md shadow-blue-500/20 tracking-wide">
              LOG IN
            </button>
          )}
        </div>
      </div>

      {/* Main Content Router */}
      {activeTab !== "lobby" && activeTab !== "wallet" && activeTab !== "refer" ? (
        <div className="animate-in fade-in duration-200">
          <button onClick={() => setActiveTab("lobby")} className="mb-4 flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-[#111724] border border-slate-800 px-3 py-1.5 rounded-lg">
            <ChevronLeft className="size-4" /> Back to Lobby
          </button>
          
          {activeTab === "fortunegems" && <FortuneGemsGame />}
          {activeTab === "roulette" && <RouletteGame />}
          {activeTab === "reels" && <ReelGame />}
          {activeTab === "cards" && <CardGame />}
          {activeTab === "aviator" && <AviatorGame />}
          {activeTab === "mines" && <MinesGame />}
        </div>
      ) : activeTab === "wallet" ? (
        <WalletView onDeposit={openDeposit} onWithdraw={openWithdraw} />
      ) : activeTab === "refer" ? (
        <ReferEarn onSignIn={() => { setStep("phone"); setMobileAuthOpen(true); }} />
      ) : (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Jackpot Banner */}
          <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[#0e131d] p-3 flex items-center justify-between shadow-lg">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[9px] uppercase font-extrabold text-blue-400 tracking-wider">Live Jackpot</span>
              </div>
              <h4 className="text-[17px] font-black text-white mt-0.5 tracking-tight">₹{jackpotAmount.toLocaleString("en-IN")}</h4>
            </div>
            <button onClick={() => setDailySpinOpen(true)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black px-3 py-1.5 rounded-lg">
              <Gift className="size-3.5" /> FREE SPIN
            </button>
          </div>

          {/* Search & Filters */}
          <div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input type="text" placeholder="Search 1win games..." value={search} onChange={(e)=>setSearch(e.target.value)} className="w-full bg-[#0f1420] border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-blue-500" />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none">
              {[
                { id: "all", label: "All Games", icon: <LayoutGrid className="size-3" /> },
                { id: "slots", label: "Slots 777", icon: <Flame className="size-3" /> },
                { id: "crash", label: "Crash", icon: <Plane className="size-3" /> },
                { id: "instant", label: "Instant", icon: <Zap className="size-3" /> },
              ].map((cat) => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id as any)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0 border transition-all ${selectedCategory === cat.id ? "bg-blue-600 border-blue-500 text-white" : "bg-[#0e141f] border-slate-800 text-slate-400"}`}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 1win 3-Column Grid */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {filteredGames.map((g) => {
              const IconComp = g.icon;
              return (
                <div key={g.id} onClick={() => setActiveTab(g.id)} className={`relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-xl border ${g.border} bg-[#0e131f] p-1.5 sm:p-2 cursor-pointer shadow-lg active:scale-95 transition-transform`}>
                  
                  {/* Provider Strip */}
                  <div className="flex items-center justify-between z-10">
                    <span className="bg-black/60 backdrop-blur-sm text-[7px] font-black tracking-wider text-slate-300 px-1 py-0.5 rounded truncate max-w-[60%]">
                      {g.provider}
                    </span>
                    {g.badge && (
                      <span className="bg-rose-600 text-white text-[7px] font-black px-1 py-0.5 rounded">
                        {g.badge}
                      </span>
                    )}
                  </div>

                  {/* 3D Icon Container */}
                  <div className="relative flex flex-1 items-center justify-center mt-1">
                    <div className={`absolute inset-0 bg-gradient-to-b ${g.gradient}`} />
                    <IconComp className={`size-9 sm:size-11 z-10 ${g.color}`} />
                  </div>

                  {/* Title & Live Dot */}
                  <div className="z-10 pt-1">
                    <p className="text-[9px] sm:text-[10px] font-black truncate text-white leading-none">
                      {g.title}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="size-1 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[7px] sm:text-[8px] font-bold text-slate-400">
                        {g.players}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Help & Support (Tucked at bottom) */}
          <div className="mt-8 rounded-xl border border-slate-800 bg-[#0e131f] p-4 text-center">
            <h3 className="text-xs font-bold text-slate-300 mb-2">Need Help?</h3>
            <Button asChild variant="outline" size="sm" className="w-full bg-[#151c2a] border-slate-700 text-[11px]">
              <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-1.5 size-3.5 text-emerald-400" /> WhatsApp Support
              </a>
            </Button>
            {!isOperator && (
              <p onClick={handleAdminAccess} className="text-[10px] text-slate-600 mt-3 cursor-pointer">Admin Portal</p>
            )}
          </div>

          {/* Admin Console (if unlocked) */}
          {isOperator && (
            <div className="mt-4 rounded-xl border border-blue-500/40 p-4 bg-blue-950/10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-black text-blue-400 flex items-center gap-1.5">
                  <ShieldCheck className="size-4" /> Operator Console
                </h2>
                {pending > 0 && <span className="bg-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold text-white">{pending} Pending</span>}
              </div>
              <AdminConsole />
            </div>
          )}
        </div>
      )}

      {/* 1win Bottom Navigation Dock */}
      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md bg-[#0a0d14]/98 backdrop-blur-xl border-t border-slate-800/90 pb-safe pt-2 px-4 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <button onClick={() => setActiveTab("lobby")} className={`flex flex-col items-center gap-1 w-12 ${activeTab === "lobby" ? "text-blue-500" : "text-slate-500 hover:text-slate-300"}`}>
          <Menu className="size-5" />
          <span className="text-[9px] font-bold">Lobby</span>
        </button>
        <button onClick={() => setActiveTab("wallet")} className={`flex flex-col items-center gap-1 w-12 ${activeTab === "wallet" ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"}`}>
          <Wallet className="size-5" />
          <span className="text-[9px] font-bold">Wallet</span>
        </button>
        <button onClick={() => setDailySpinOpen(true)} className="flex flex-col items-center gap-1 w-12 text-slate-500 hover:text-amber-400 relative">
          <Gift className="size-5" />
          <span className="absolute top-0 right-2 size-2 bg-rose-500 rounded-full border border-[#0a0d14]"></span>
          <span className="text-[9px] font-bold">Bonus</span>
        </button>
        <button onClick={() => setActiveTab("refer")} className={`flex flex-col items-center gap-1 w-12 ${activeTab === "refer" ? "text-blue-500" : "text-slate-500 hover:text-slate-300"}`}>
          <TrendingUp className="size-5" />
          <span className="text-[9px] font-bold">Earn</span>
        </button>
        <button onClick={() => setProfileOpen(true)} className="flex flex-col items-center gap-1 w-12 text-slate-500 hover:text-slate-300">
          <UserIcon className="size-5" />
          <span className="text-[9px] font-bold">Profile</span>
        </button>
      </div>

      {/* Mobile Auth Modal (Untouched Logic) */}
      {mobileAuthOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0e131f] p-5 shadow-2xl border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              {step === "phone" ? <Phone className="size-5 text-blue-500" /> : <KeyRound className="size-5 text-blue-500" />}
              <h2 className="text-lg font-black text-white">{step === "phone" ? "Sign In" : "Enter OTP"}</h2>
            </div>

            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-[11px] text-slate-400">Enter your 10-digit mobile number for WhatsApp verification.</p>
                <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-[#0a0d14] px-3 py-2">
                  <span className="text-sm font-bold text-slate-500">+91</span>
                  <input type="tel" maxLength={10} placeholder="Mobile Number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="w-full bg-transparent outline-none text-white text-sm" autoFocus required />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="w-full bg-blue-600 text-white font-bold text-xs h-9">Verify <ExternalLink className="ml-1.5 size-3" /></Button>
                  <Button type="button" variant="outline" onClick={() => setMobileAuthOpen(false)} className="h-9 text-xs border-slate-700 text-slate-400">Cancel</Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-[11px] text-slate-400">Message sent to Admin. Enter the 4-digit code provided.</p>
                <input type="text" maxLength={4} placeholder="----" value={enteredOtp} onChange={(e) => setEnteredOtp(e.target.value)} className="w-full text-center tracking-[1em] text-xl font-mono py-2 rounded-xl border border-slate-700 bg-[#0a0d14] outline-none text-white" autoFocus required />
                <div className="flex gap-2">
                  <Button type="submit" className="w-full bg-blue-600 text-white font-bold text-xs h-9">Confirm</Button>
                  <Button type="button" variant="outline" onClick={() => setStep("phone")} className="h-9 text-xs border-slate-700 text-slate-400">Back</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Global Modals */}
      <TopUpModal isOpen={topUpOpen} onClose={() => setTopUpOpen(false)} />
      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
      <DailySpinModal open={dailySpinOpen} onOpenChange={setDailySpinOpen} />
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} onDeposit={openDeposit} onWithdraw={openWithdraw} />
      
    </main>
  );
}
