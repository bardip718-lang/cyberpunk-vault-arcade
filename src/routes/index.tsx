
  import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Gamepad2, LogIn, LogOut, ShieldCheck, Wallet, MessageCircle, Gift, Phone, Sparkles, Zap, Layers, Bomb, Plane, Disc, ChevronLeft, RotateCcw, Trophy } from "lucide-react";
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
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<{ num: number; color: string } | null>(null);
  const [winMsg, setWinMsg] = useState<string | null>(null);
  const [rot, setRot] = useState(0);

  const handleSpin = () => {
    if (!selectedBet) return alert("Select bet option first!");
    if ((user?.balance || 0) < betAmount) return alert("Insufficient balance!");
    if (typeof updateBalance === "function") updateBalance(-betAmount);

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
      <h2 className="font-display text-2xl neon-text flex items-center gap-2">
        <Disc className="size-6 text-primary" /> Neon Roulette
      </h2>
      <div className="flex flex-col items-center justify-center my-6">
        <div className="relative flex items-center justify-center size-52 rounded-full border-4 border-primary/40 bg-background/90 shadow-xl overflow-hidden">
          <div className="w-full h-full rounded-full transition-transform duration-[3000ms] ease-out flex items-center justify-center" style={{ transform: `rotate(${rot}deg)` }}>
            <Sparkles className="size-12 text-primary/30 animate-pulse" />
          </div>
          <div className="absolute z-10 flex flex-col items-center justify-center size-20 rounded-full border border-border bg-secondary/90 shadow-md">
            {lastResult ? (
              <span className={`text-xl font-bold font-display ${lastResult.color === "red" ? "text-rose-400" : lastResult.color === "black" ? "text-slate-300" : "text-emerald-400"}`}>
                {lastResult.num}
              </span>
            ) : <span className="text-xs font-display text-muted-foreground">SPIN</span>}
          </div>
        </div>
        {winMsg && <div className="mt-3 text-sm font-display font-bold text-primary flex items-center gap-1"><Trophy className="size-4"/>{winMsg}</div>}
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Button type="button" variant={selectedBet === "red" ? "default" : "secondary"} onClick={() => setSelectedBet("red")} className="text-rose-300 font-bold">RED 2x</Button>
          <Button type="button" variant={selectedBet === "black" ? "default" : "secondary"} onClick={() => setSelectedBet("black")} className="text-slate-300 font-bold">BLACK 2x</Button>
          <Button type="button" variant={selectedBet === "green" ? "default" : "secondary"} onClick={() => setSelectedBet("green")} className="text-emerald-300 font-bold">GREEN 14x</Button>
        </div>
        <div className="flex gap-2">
          {[10, 20, 50, 100, 500].map((a) => (
            <Button key={a} size="sm" variant={betAmount === a ? "default" : "outline"} onClick={() => setBetAmount(a)}>₹{a}</Button>
          ))}
        </div>
        <Button onClick={handleSpin} disabled={spinning} className="w-full py-5 text-base font-display font-bold">
          {spinning ? <span className="flex items-center gap-2"><RotateCcw className="size-4 animate-spin"/> Spinning...</span> : `Spin for ₹${betAmount}`}
        </Button>
      </div>
    </div>
  );
}

const GAMES = [
  { id: "roulette", name: "Neon Roulette", tagline: "Red, Black & 14x Green Wheel", badge: "NEW", icon: Disc, color: "text-purple-400" },
  { id: "aviator", name: "Aviator Crash", tagline: "High Multiplier Cashout", badge: "HOT", icon: Plane, color: "text-rose-400" },
  { id: "mines", name: "Cyber Mines", tagline: "Uncover Gems Avoid Traps", badge: "POPULAR", icon: Bomb, color: "text-emerald-400" },
  { id: "reels", name: "Neon Reels 3x5", tagline: "Classic Vegas Multi-Line", badge: "CLASSIC", icon: Zap, color: "text-amber-400" },
  { id: "cards", name: "Data Match Matrix", tagline: "Cyber Memory Puzzle", badge: "SKILL", icon: Layers, color: "text-cyan-400" },
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
    if (saved) setActiveUserMobile(saved);
    else if (!user && typeof signInAsGuest === "function") signInAsGuest();
  }, [user, signInAsGuest]);

  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = mobileNumber.replace(/\D/g, "");
    if (clean.length !== 10) return alert("Enter 10-digit number");
    localStorage.setItem("win1_user_phone", clean);
    setActiveUserMobile(clean);
    setMobileAuthOpen(false);
  };

  const isOperator = isAdminUnlocked || (!!user && !user.guest && user.email === ADMIN_EMAIL);
  const pending = requests?.filter((r) => r.status === "pending")?.length || 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 pb-16 pt-6">
      <header className="neon-panel mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl p-4">
        <div className="cursor-pointer" onClick={() => setActiveTab("lobby")}>
          <h1 className="font-display text-3xl neon-text">win1</h1>
          <p className="text-xs text-muted-foreground uppercase">Gaming & Vault</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-border bg-background/60 px-3 py-1 text-right">
            <p className="text-[10px] uppercase text-muted-foreground">Balance</p>
            <p className="font-display text-lg text-primary">{user ? user.balance : 0}</p>
          </div>
          <Button size="sm" onClick={() => setTopUpOpen(true)}><ArrowDownToLine className="size-4"/> Deposit</Button>
          <Button size="sm" variant="secondary" onClick={() => activeUserMobile ? setWithdrawOpen(true) : setMobileAuthOpen(true)}><ArrowUpFromLine className="size-4"/> Withdraw</Button>
          {activeUserMobile ? (
            <Button size="sm" variant="ghost" onClick={() => { localStorage.removeItem("win1_user_phone"); setActiveUserMobile(null); if (signOut) signOut(); }}><LogOut className="size-4"/></Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setMobileAuthOpen(true)}><LogIn className="size-4"/> Login</Button>
          )}
        </div>
      </header>

      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{activeUserMobile ? `+91 ${activeUserMobile}` : "Guest Player"} {isOperator && " · Operator"}</span>
        {activeTab !== "lobby" && (
          <Button variant="outline" size="sm" onClick={() => setActiveTab("lobby")}><ChevronLeft className="size-4"/> Lobby</Button>
        )}
      </div>

      <div className="mb-6 flex gap-2">
        <Button variant={activeTab === "lobby" ? "default" : "secondary"} onClick={() => setActiveTab("lobby")} size="sm"><Gamepad2 className="mr-1 size-4"/> Lobby</Button>
        <Button variant={activeTab === "wallet" ? "default" : "secondary"} onClick={() => setActiveTab("wallet")} size="sm"><Wallet className="mr-1 size-4"/> Wallet</Button>
        <Button variant={activeTab === "refer" ? "default" : "secondary"} onClick={() => setActiveTab("refer")} size="sm"><Gift className="mr-1 size-4"/> Refer & Earn</Button>
      </div>

      {activeTab === "lobby" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.id} onClick={() => setActiveTab(g.id)} className="neon-panel cursor-pointer rounded-xl border border-border p-4 hover:border-primary/60 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-border bg-background p-2.5"><Icon className={`size-6 ${g.color}`}/></div>
                    <div>
                      <h3 className="font-display font-bold text-foreground">{g.name}</h3>
                      <p className="text-xs text-muted-foreground">{g.tagline}</p>
                    </div>
                  </div>
                  <span className="rounded-full border px-2 py-0.5 text-[9px] font-bold text-primary border-primary/30">{g.badge}</span>
                </div>
                <Button size="sm" className="w-full mt-4 font-display font-semibold">Play Now</Button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "roulette" && <NeonRoulette />}
      {activeTab === "reels" && <ReelGame />}
      {activeTab === "cards" && <CardGame />}
      {activeTab === "aviator" && <AviatorGame />}
      {activeTab === "mines" && <MinesGame />}
      {activeTab === "wallet" && <WalletView onDeposit={() => setTopUpOpen(true)} onWithdraw={() => setWithdrawOpen(true)} />}
      {activeTab === "refer" && <ReferEarn onSignIn={() => setMobileAuthOpen(true)} />}

      {isOperator && (
        <div className="neon-panel mt-8 rounded-xl p-4 border border-primary/40">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg neon-text flex items-center gap-2"><ShieldCheck className="size-4 text-primary"/> Admin Console</h2>
            {pending > 0 && <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded font-bold">{pending} Pending</span>}
          </div>
          <AdminConsole />
        </div>
      )}

      <div className="neon-panel mt-6 rounded-xl p-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Need help with payments?</span>
        <div className="flex gap-2">
          <Button size="sm" asChild><a href={SUPPORT_WHATSAPP} target="_blank"><MessageCircle className="size-4"/> WhatsApp</a></Button>
          {!isOperator && <Button size="sm" variant="ghost" onClick={() => { if (window.prompt("PIN:") === "789012") setIsAdminUnlocked(true); }}>Operator</Button>}
        </div>
      </div>

      {mobileAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="neon-panel w-full max-w-sm rounded-xl p-5 shadow-2xl border border-primary/30">
            <h2 className="font-display text-lg neon-text flex items-center gap-2 mb-2"><Phone className="size-4 text-primary"/> Mobile Login</h2>
            <form onSubmit={handlePhoneLogin} className="space-y-3">
              <input type="tel" maxLength={10} placeholder="10-digit Mobile Number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="w-full rounded-lg border border-border bg-background p-2 font-display outline-none" required />
              <div className="flex gap-2">
                <Button type="submit" className="w-full">Continue</Button>
                <Button type="button" variant="secondary" onClick={() => setMobileAuthOpen(false)}>Cancel</Button>
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
            
                          
