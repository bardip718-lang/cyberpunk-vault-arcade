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
  Bomb,
  Plane,
  ChevronLeft,
  KeyRound,
  ExternalLink,
  Flame,
  LayoutGrid,
  User as UserIcon,
  Search,
  TrendingUp,
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
      { title: "1win — Arcade Gaming & Reward Vault" },
      {
        name: "description",
        content:
          "1win is a high-reward vault: Aviator crash, Fortune Gems 2 slots, Mines, and Lightning Roulette.",
      },
    ],
  }),
  component: Index,
});

type GameCategory = "all" | "slots" | "crash" | "instant";

const GAME_CARDS = [
  {
    id: "aviator",
    category: "crash",
    title: "AVIATOR",
    provider: "SPRIBE",
    players: "1,467",
    badge: "HOT",
    badgeBg: "bg-rose-600",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=500&auto=format&fit=crop&q=80",
    gradient: "from-rose-950/80 via-transparent to-black/90",
  },
  {
    id: "fortunegems",
    category: "slots",
    title: "FORTUNE GEMS 2",
    provider: "JILI GAMES",
    players: "2,350",
    badge: "TOP",
    badgeBg: "bg-amber-500",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80",
    gradient: "from-amber-950/80 via-transparent to-black/90",
  },
  {
    id: "mines",
    category: "instant",
    title: "MINES",
    provider: "1WIN GAMES",
    players: "614",
    badge: "EASY",
    badgeBg: "bg-sky-600",
    image: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80",
    gradient: "from-sky-950/80 via-transparent to-black/90",
  },
  {
    id: "roulette",
    category: "instant",
    title: "ROULETTE",
    provider: "EVOLUTION",
    players: "1,890",
    badge: "LIVE",
    badgeBg: "bg-purple-600",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80",
    gradient: "from-purple-950/80 via-transparent to-black/90",
  },
  {
    id: "reels",
    category: "slots",
    title: "NEON REELS 777",
    provider: "1WIN GAMES",
    players: "750",
    badge: "CLASSIC",
    badgeBg: "bg-emerald-600",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=80",
    gradient: "from-emerald-950/80 via-transparent to-black/90",
  },
  {
    id: "cards",
    category: "instant",
    title: "BLACKJACK",
    provider: "1WIN GAMES",
    players: "410",
    badge: "SKILL",
    badgeBg: "bg-blue-600",
    image: "https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=500&auto=format&fit=crop&q=80",
    gradient: "from-blue-950/80 via-transparent to-black/90",
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
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#080b11] text-slate-100 font-sans px-3 pb-24 pt-3 select-none">
      
      {/* 1win Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3 sticky top-0 bg-[#080b11]/95 backdrop-blur-md z-40">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveTab("lobby")}>
          <span className="text-2xl font-black italic tracking-tighter text-blue-500">1win</span>
          <span className="text-[9px] bg-blue-600/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-bold">PRO</span>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <div 
                onClick={() => setProfileOpen(true)}
                className="bg-[#101622] border border-slate-800 rounded-lg px-2.5 py-0.5 text-right cursor-pointer hover:border-slate-700"
              >
                <span className="text-[9px] text-slate-400 block -mb-1">BALANCE</span>
                <span className="text-[13px] font-black text-emerald-400">
                  ₹{user?.balance?.toLocaleString() || "0"}
                </span>
              </div>

              <button onClick={openDeposit} className="bg-emerald-600 p-1.5 rounded-lg text-white active:scale-95 transition-transform">
                <ArrowDownToLine className="size-4" />
              </button>
              <button onClick={() => setProfileOpen(true)} className="bg-[#151c2a] border border-slate-700 p-1.5 rounded-lg text-slate-300 active:scale-95 transition-transform">
                <UserIcon className="size-4" />
              </button>
            </>
          ) : (
            <button onClick={() => { setStep("phone"); setMobileAuthOpen(true); }} className="bg-blue-600 text-white text-[11px] font-black px-3.5 py-2 rounded-lg shadow-md shadow-blue-500/20 tracking-wide active:scale-95">
              LOG IN
            </button>
          )}
        </div>
      </div>

      {/* Main Screen Switcher */}
      {activeTab !== "lobby" && activeTab !== "wallet" && activeTab !== "refer" ? (
        <div className="animate-in fade-in duration-200">
          <button onClick={() => setActiveTab("lobby")} className="mb-4 flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-[#111724] border border-slate-800 px-3 py-1.5 rounded-lg active:scale-95">
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
        <div className="space-y-3.5 animate-in fade-in duration-200">
          
          {/* Jackpot Banner */}
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[#0e131d] p-3.5 flex items-center justify-between shadow-lg">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[9px] uppercase font-extrabold text-blue-400 tracking-wider">Live Jackpot</span>
              </div>
              <h4 className="text-[18px] font-black text-white mt-0.5 tracking-tight">₹{jackpotAmount.toLocaleString("en-IN")}</h4>
            </div>
            <button onClick={() => setDailySpinOpen(true)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black px-3.5 py-2 rounded-xl shadow-md active:scale-95">
              <Gift className="size-3.5" /> FREE SPIN
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search 1win games..." 
              value={search} 
              onChange={(e)=>setSearch(e.target.value)} 
              className="w-full bg-[#0f1420] border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 outline-none focus:border-blue-500" 
            />
          </div>

          {/* Categories Horizontal Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none">
            {[
              { id: "all", label: "All Games", icon: <LayoutGrid className="size-3" /> },
              { id: "slots", label: "Slots 777", icon: <Flame className="size-3" /> },
              { id: "crash", label: "Crash", icon: <Plane className="size-3" /> },
              { id: "instant", label: "Instant", icon: <Zap className="size-3" /> },
            ].map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => setSelectedCategory(cat.id as any)} 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0 border transition-all ${selectedCategory === cat.id ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20" : "bg-[#0e141f] border-slate-800 text-slate-400"}`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* 1win Authentic 3-Column Poster Grid (Real 3D Graphics) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {filteredGames.map((g) => (
              <div
                key={g.id}
                onClick={() => setActiveTab(g.id)}
                className="group cursor-pointer select-none flex flex-col active:scale-95 transition-transform duration-150"
              >
                {/* 3:4 Vertical Aspect Poster */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#0e131f] border border-white/10 shadow-xl group-hover:border-blue-500/40">
                  
                  {/* High Quality Game Visual Asset */}
                  <img
                    src={g.image}
                    alt={g.title}
                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />

                  {/* Contrast Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-b ${g.gradient}`} />

                  {/* Top Provider Ribbon Tag & Badge */}
                  <div className="absolute top-1.5 left-0 right-0 flex items-center justify-between px-1.5 z-20">
                    <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-200 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded truncate max-w-[65%]">
                      {g.provider}
                    </span>
                    {g.badge && (
                      <span className={`text-[7px] font-black uppercase text-white ${g.badgeBg} px-1 py-0.5 rounded shadow`}>
                        {g.badge}
                      </span>
                    )}
                  </div>

                  {/* 1win Style Bold Title at Top */}
                  <div className="absolute top-6 left-0 right-0 px-1 z-20 text-center">
                    <h3 className="font-sans font-black text-white text-[11px] sm:text-[12px] leading-tight tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,1)] uppercase">
                      {g.title}
                    </h3>
                  </div>

                  {/* Gloss Vignette Bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                </div>

                {/* Live Playing Counter Under Poster */}
                <div className="mt-1 flex items-center gap-1.5 px-0.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] animate-pulse" />
                  <span className="text-[9.5px] font-bold text-slate-400">
                    {g.players} playing
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp Support Button */}
          <div className="mt-8 rounded-2xl border border-slate-800 bg-[#0e131f] p-4 text-center">
            <h3 className="text-xs font-bold text-slate-300 mb-2">Need Help?</h3>
            <Button asChild variant="outline" size="sm" className="w-full bg-[#151c2a] border-slate-700 text-[11px] active:scale-95">
              <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-1.5 size-3.5 text-emerald-400" /> WhatsApp Support
              </a>
            </Button>
            {!isOperator && (
              <p onClick={handleAdminAccess} className="text-[10px] text-slate-600 mt-3 cursor-pointer">Operator Portal</p>
            )}
          </div>

          {/* Admin Operator Console */}
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

      {/* 1win Bottom Navigation Bar */}
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
        <button onClick={() => setActiveTab("refer")} className={`flex flex-col items-center gap-1 w-12 ${activeTab === "refer" ? "text-blue-500" : "text-slate-500 hover:text-slate-300"}`}>
          <TrendingUp className="size-5" />
          <span className="text-[9px] font-bold">Earn</span>
        </button>
        <button onClick={() => setProfileOpen(true)} className="flex flex-col items-center gap-1 w-12 text-slate-500 hover:text-slate-300">
          <UserIcon className="size-5" />
          <span className="text-[9px] font-bold">Profile</span>
        </button>
      </div>

      {/* Mobile WhatsApp Auth Modal */}
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

      {/* Modals */}
      <TopUpModal isOpen={topUpOpen} onClose={() => setTopUpOpen(false)} />
      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
      <DailySpinModal open={dailySpinOpen} onOpenChange={setDailySpinOpen} />
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} onDeposit={openDeposit} onWithdraw={openWithdraw} />
      
    </main>
  );
}
