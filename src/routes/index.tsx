import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Gamepad2,
  LogIn,
  LogOut,
  ShieldCheck,
  Wallet,
  MessageCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ReelGame } from "@/components/reel-game";
import { CardGame } from "@/components/card-game";
import { AdminConsole } from "@/components/admin-console";
import { AuthModal } from "@/components/auth-modal";
import { TopUpModal } from "@/components/topup-modal";
import { WithdrawModal } from "@/components/withdraw-modal";
import { WalletView } from "@/components/wallet-view";
import { AviatorGame } from "@/components/aviator-game";
import { MinesGame } from "@/components/mines-game";
import { SUPPORT_WHATSAPP } from "@/lib/notify";
import { useVault, ADMIN_EMAIL } from "@/lib/vault-store";

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
  const { user, signOut } = useVault();
  const { requests } = useVaultRequests();
  useRequestBalanceSync();
  const [authOpen, setAuthOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const isOperator = !!user && !user.guest && user.email === ADMIN_EMAIL;
  const pending = requests.filter((r) => r.status === "pending").length;

  const openDeposit = () => (user ? setTopUpOpen(true) : setAuthOpen(true));
  const openWithdraw = () => (user ? setWithdrawOpen(true) : setAuthOpen(true));


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
          {user ? (
            <Button variant="ghost" onClick={signOut} aria-label="Sign out">
              <LogOut className="size-4" /> {user.guest ? "Exit guest" : "Sign out"}
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setAuthOpen(true)}>
              <LogIn className="size-4" /> Sign in
            </Button>
          )}
        </div>
      </header>

      {user && (
        <p className="mb-4 text-sm text-muted-foreground">
          Logged in as <span className="text-foreground">{user.name}</span>
          {user.guest ? " · guest session" : ` · ${user.email}`}
          {user.admin && " · operator"}
        </p>
      )}

      <Tabs defaultValue="reels">
        <TabsList className={`mb-5 grid w-full ${isOperator ? "grid-cols-6" : "grid-cols-5"} bg-secondary/60`}>
          <TabsTrigger value="reels">
            <Gamepad2 className="mr-1 size-4" /> Reels
          </TabsTrigger>
          <TabsTrigger value="cards">Data Match</TabsTrigger>
          <TabsTrigger value="aviator">Aviator</TabsTrigger>
          <TabsTrigger value="mines">Mines</TabsTrigger>
          <TabsTrigger value="wallet">
            <Wallet className="mr-1 size-4" /> Wallet
          </TabsTrigger>
          {isOperator && (
            <TabsTrigger value="admin">
              <ShieldCheck className="mr-1 size-4" /> Admin{pending > 0 ? ` (${pending})` : ""}
            </TabsTrigger>
          )}
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
        {isOperator && (
          <TabsContent value="admin">
            <AdminConsole />
          </TabsContent>
        )}
      </Tabs>

      <div className="neon-panel mt-8 rounded-xl p-5">
        <h2 className="font-display text-xl neon-text">Help &amp; Support</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Payment stuck, UTR not matched or withdrawal delayed? Talk to a human operator on WhatsApp.
        </p>
        <Button asChild className="mt-4 font-display tracking-wide">
          <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4" /> WhatsApp Customer Support
          </a>
        </Button>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />
      <WithdrawModal open={withdrawOpen} onOpenChange={setWithdrawOpen} />
    </main>
  );
}
