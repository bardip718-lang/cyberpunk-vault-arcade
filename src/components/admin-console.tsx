import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVault, type Order } from "@/lib/vault-store";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { readNotificationLog, OPS_EMAIL, type NotificationEntry } from "@/lib/notify";

function StatusBadge({ status }: { status: Order["status"] }) {
  if (status === "approved") return <Badge className="bg-success text-success-foreground">Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

export function AdminConsole() {
  const { orders, resolveOrder } = useVault();
  const [log, setLog] = useState<NotificationEntry[]>([]);

  useEffect(() => {
    const sync = () => setLog(readNotificationLog());
    sync();
    window.addEventListener("win1-notification", sync);
    return () => window.removeEventListener("win1-notification", sync);
  }, [orders]);

  const pending = orders.filter((o) => o.status === "pending");
  const history = orders.filter((o) => o.status !== "pending");

  return (
    <section className="space-y-6">
      <div className="neon-panel rounded-xl p-5">
        <h2 className="font-display text-xl neon-text">Pending Orders ({pending.length})</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Approving credits the user&apos;s score balance instantly.
        </p>

        {pending.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No pending top-up requests.
          </p>
        ) : (
          <ul className="space-y-3">
            {pending.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-sm">
                    <Badge variant={o.type === "withdrawal" ? "destructive" : "secondary"} className="mr-2">
                      {o.type === "withdrawal" ? "Withdraw" : "Deposit"}
                    </Badge>
                    {o.userName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {o.type === "withdrawal" ? (
                      <>Payout to <span className="text-primary">{o.destination}</span></>
                    ) : (
                      <>UTR <span className="text-primary">{o.utr}</span></>
                    )}{" "}
                    · {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg text-accent">₹{o.amount}</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      resolveOrder(o.id, "approved");
                      toast.success(`Approved ${o.amount} credits`);
                    }}
                  >
                    <Check className="size-4" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      resolveOrder(o.id, "rejected");
                      toast.info("Order rejected");
                    }}
                  >
                    <X className="size-4" /> Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="neon-panel rounded-xl p-5">
        <h2 className="font-display text-xl neon-text">Processed history</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing processed yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-4 py-2 text-sm"
              >
                <span className="truncate">{o.userName}</span>
                <span className="text-muted-foreground">
                  {o.type === "withdrawal" ? `Payout ${o.destination}` : `UTR ${o.utr}`}
                </span>
                <span className="font-display">₹{o.amount}</span>
                <StatusBadge status={o.status} />
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
