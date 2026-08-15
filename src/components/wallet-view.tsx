import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVault, type Order } from "@/lib/vault-store";

function StatusBadge({ status }: { status: Order["status"] }) {
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
  const { user, orders } = useVault();
  const mine = user ? orders.filter((o) => o.userId === user.id) : [];

  return (
    <section className="space-y-6">
      <div className="neon-panel rounded-xl p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Vault balance</p>
        <p className="font-display text-4xl neon-text">{user ? user.balance : 0}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={onDeposit} className="font-display tracking-wide">
            <ArrowDownToLine className="size-4" /> Deposit
          </Button>
          <Button onClick={onWithdraw} variant="secondary" className="font-display tracking-wide">
            <ArrowUpFromLine className="size-4" /> Withdraw
          </Button>
        </div>
        {!user && (
          <p className="mt-3 text-sm text-muted-foreground">Sign in to move credits in or out.</p>
        )}
      </div>

      <div className="neon-panel rounded-xl p-5">
        <h2 className="font-display text-xl neon-text">Your transactions</h2>
        {mine.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No deposits or withdrawals yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {mine.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-4 py-2 text-sm"
              >
                <span className="font-display uppercase tracking-wide">
                  {o.type === "withdrawal" ? "Withdraw" : "Deposit"}
                </span>
                <span className="truncate text-muted-foreground">
                  {o.type === "withdrawal" ? o.destination : `UTR ${o.utr}`}
                </span>
                <span className="font-display">₹{o.amount}</span>
                <StatusBadge status={o.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
