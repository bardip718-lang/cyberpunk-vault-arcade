import { ArrowDownToLine, ArrowUpFromLine, Coins, Gift, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVault } from "@/lib/vault-store";
import { useVaultRequests } from "@/lib/use-vault-requests";
import type { RequestStatus } from "@/lib/requests.functions";

function StatusBadge({ status }: { status: RequestStatus }) {
  if (status === "approved") return <Badge className="bg-success text-success-foreground">Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

export function WalletView({
  onDeposit,
  onWithdraw,
}: {
  onDeposit: () => void;
  onWithdraw: () => void;
}) {
  const { user, withdrawable, withdrawLock } = useVault();
  const { requests } = useVaultRequests();
  const mine = requests.filter((r) => r.userKey === user.id);

  return (
    <section className="space-y-6">
      <div className="neon-panel rounded-xl p-5">
        {user.guest ? (
          <>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Demo coins</p>
            <p className="font-display text-4xl neon-text">{user.demoBalance}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Guest mode is demo play only. Demo coins have no cash value and cannot be withdrawn.
            </p>
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                <Coins className="size-3.5" /> Real cash
              </p>
              <p className="font-display text-3xl neon-text">₹{user.realBalance}</p>
              <p className="mt-1 text-xs text-muted-foreground">100% withdrawable</p>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                <Gift className="size-3.5" /> Bonus cash
              </p>
              <p className="font-display text-3xl text-amber-400">₹{user.bonusBalance}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {user.wagerRemaining > 0
                  ? `₹${user.wagerRemaining} turnover left to unlock`
                  : "Unlocked"}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={onDeposit} className="font-display tracking-wide">
            <ArrowDownToLine className="size-4" /> Deposit
          </Button>
          <Button onClick={onWithdraw} variant="secondary" className="font-display tracking-wide">
            <ArrowUpFromLine className="size-4" /> Withdraw
          </Button>
        </div>

        {withdrawLock.locked ? (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="size-3.5" /> {withdrawLock.reason}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Withdrawable now: <span className="font-display text-primary">₹{withdrawable}</span>
          </p>
        )}
      </div>

      <div className="neon-panel rounded-xl p-5">
        <h2 className="font-display text-xl neon-text">Your transactions</h2>
        {mine.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No deposits or withdrawals yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {mine.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-4 py-2 text-sm"
              >
                <span className="font-display uppercase tracking-wide">
                  {r.kind === "withdrawal" ? "Withdraw" : "Deposit"}
                </span>
                <span className="truncate text-muted-foreground">
                  {r.kind === "withdrawal" ? r.destination : `UTR ${r.utr}`}
                </span>
                <span className="font-display">₹{r.amount}</span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
