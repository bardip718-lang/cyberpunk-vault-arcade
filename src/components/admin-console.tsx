import { Check, X, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { PaymentSettingsPanel } from "@/components/payment-settings";
import { readNotificationLog, notifyOps, OPS_EMAIL, type NotificationEntry } from "@/lib/notify";
import { useVaultRequests } from "@/lib/use-vault-requests";
import { REQUESTS_KEY } from "@/lib/requests-query";
import { resolveRequest, type VaultRequest, type RequestStatus } from "@/lib/requests.functions";

function StatusBadge({ status }: { status: RequestStatus }) {
  if (status === "approved") return <Badge className="bg-success text-success-foreground">Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

function label(r: VaultRequest) {
  return r.userEmail ? `${r.userName} · ${r.userEmail}` : r.userName;
}

export function AdminConsole() {
  const { user } = useVault();
  const { requests, isLoading } = useVaultRequests();
  const queryClient = useQueryClient();
  const resolveFn = useServerFn(resolveRequest);
  const [log, setLog] = useState<NotificationEntry[]>([]);

  useEffect(() => {
    const sync = () => setLog(readNotificationLog());
    sync();
    window.addEventListener("win1-notification", sync);
    return () => window.removeEventListener("win1-notification", sync);
  }, [requests]);

  const resolve = useMutation({
    mutationFn: (vars: { id: string; status: "approved" | "rejected" }) =>
      resolveFn({ data: { adminEmail: user?.email ?? "", id: vars.id, status: vars.status } }),
    onSuccess: (row) => {
      notifyOps(`Transaction ${row.status}`, {
        Type: row.kind === "withdrawal" ? "Withdrawal" : "Deposit",
        User: label(row),
        "User ID": row.userKey,
        Amount: `₹${row.amount}`,
        Reference: row.kind === "withdrawal" ? row.destination || "—" : row.utr,
        Status: row.status,
        "Resolved at": new Date().toLocaleString(),
      });
      queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
      toast.success(`${row.kind === "withdrawal" ? "Withdrawal" : "Deposit"} ${row.status} successfully`);
    },
    onError: (e: Error) => toast.error(e.message || "Could not update this request"),
  });

  const pendingDeposits = requests.filter((r) => r.status === "pending" && r.kind === "deposit");
  const pendingWithdrawals = requests.filter((r) => r.status === "pending" && r.kind === "withdrawal");
  const history = requests.filter((r) => r.status !== "pending");

  function renderRow(r: VaultRequest) {
    return (
      <li
        key={r.id}
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-4"
      >
        <div className="min-w-0">
          <p className="truncate font-display text-sm">{label(r)}</p>
          <p className="text-sm text-muted-foreground">
            {r.kind === "withdrawal" ? (
              <>Payout to <span className="text-primary">{r.destination}</span></>
            ) : (
              <>UTR <span className="text-primary">{r.utr}</span></>
            )}{" "}
            · {new Date(r.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-lg text-accent">₹{r.amount}</span>
          <Button
            size="sm"
            disabled={resolve.isPending}
            onClick={() => resolve.mutate({ id: r.id, status: "approved" })}
          >
            <Check className="size-4" /> Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={resolve.isPending}
            onClick={() => resolve.mutate({ id: r.id, status: "rejected" })}
          >
            <X className="size-4" /> Reject
          </Button>
        </div>
      </li>
    );
  }

  return (
    <section className="space-y-6">
      <PaymentSettingsPanel />

      <div className="neon-panel rounded-xl p-5">
        <h2 className="font-display text-xl neon-text">
          Pending Deposits ({pendingDeposits.length})
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Approving credits the player&apos;s balance automatically.
        </p>
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading live requests…
          </p>
        ) : pendingDeposits.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No pending deposit requests.
          </p>
        ) : (
          <ul className="space-y-3">{pendingDeposits.map(renderRow)}</ul>
        )}
      </div>

      <div className="neon-panel rounded-xl p-5">
        <h2 className="font-display text-xl neon-text">
          Pending Withdrawals ({pendingWithdrawals.length})
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          The amount is already locked; rejecting refunds it to the player.
        </p>
        {pendingWithdrawals.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No pending withdrawal requests.
          </p>
        ) : (
          <ul className="space-y-3">{pendingWithdrawals.map(renderRow)}</ul>
        )}
      </div>

      <div className="neon-panel rounded-xl p-5">
        <h2 className="font-display text-xl neon-text">Processed history</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing processed yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-4 py-2 text-sm"
              >
                <span className="truncate">{label(r)}</span>
                <span className="text-muted-foreground">
                  {r.kind === "withdrawal" ? `Payout ${r.destination}` : `UTR ${r.utr}`}
                </span>
                <span className="font-display">₹{r.amount}</span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="neon-panel rounded-xl p-5">
        <h2 className="font-display text-xl neon-text">Notification log</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Every request and approval is reported to <span className="text-primary">{OPS_EMAIL}</span>.
        </p>
        {log.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          <ul className="space-y-2">
            {log.map((n) => (
              <li key={n.id} className="rounded-md border border-border px-4 py-2 text-sm">
                <p className="font-display">
                  {n.subject}{" "}
                  <span className="text-xs text-muted-foreground">
                    · {new Date(n.createdAt).toLocaleString()}
                  </span>
                </p>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-xs text-muted-foreground">{n.body}</pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
