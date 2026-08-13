import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Gamepad2, LogIn, LogOut, ShieldCheck, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ReelGame } from "@/components/reel-game";
import { CardGame } from "@/components/card-game";
import { AdminConsole } from "@/components/admin-console";
import { AuthModal } from "@/components/auth-modal";
import { TopUpModal } from "@/components/topup-modal";
import { useVault } from "@/lib/vault-store";

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
  const { user, orders, signOut } = useVault();
  const [authOpen, setAuthOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const pending = orders.filter((o) => o.status === "pending").length;

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
          {user ? (
            <>
              <Button variant="secondary" onClick={() => setTopUpOpen(true)}>
                <Wallet className="size-4" /> Top up
              </Button>
              <Button variant="ghost" onClick={signOut} aria-label="Sign out">
                <LogOut className="size-4" /> {user.guest ? "Exit guest" : "Sign out"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setAuthOpen(true)}>
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
        <TabsList className="mb-5 grid w-full grid-cols-3 bg-secondary/60">
          <TabsTrigger value="reels">
            <Gamepad2 className="mr-1 size-4" /> Reels
          </TabsTrigger>
          <TabsTrigger value="cards">Data Match</TabsTrigger>
          <TabsTrigger value="admin">
            <ShieldCheck className="mr-1 size-4" /> Admin{pending > 0 ? ` (${pending})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reels">
          <ReelGame />
        </TabsContent>
        <TabsContent value="cards">
          <CardGame />
        </TabsContent>
        <TabsContent value="admin">
          <AdminConsole />
        </TabsContent>
      </Tabs>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <TopUpModal open={topUpOpen} onOpenChange={setTopUpOpen} />
    </main>
  );
}
