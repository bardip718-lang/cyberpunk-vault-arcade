import { useState, useEffect } from "react";
import { useVault } from "@/lib/vault-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Gift,
  Copy,
  Check,
  QrCode,
  RefreshCw,
  BadgeCheck,
  XCircle,
  Clock3,
  Inbox,
  ArrowUpFromLine,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

type LocalRequest = {
  id: string;
  kind: "deposit" | "withdrawal";
  amount: number;
  status: "pending" | "approved" | "rejected";
  phone: string;
  utr?: string;
  destination?: string;
  createdAt: string;
};

export function AdminConsole() {
  const { payment, updatePaymentSettings, settleRequest } = useVault();
  const [upiId, setUpiId] = useState(payment.upiId);
  const [displayName, setDisplayName] = useState(payment.displayName);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Voucher States
  const [voucherAmount, setVoucherAmount] = useState<number>(250);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Unified Request Queue State
  const [requests, setRequests] = useState<LocalRequest[]>([]);

  const loadRequests = () => {
    try {
      const raw = localStorage.getItem("win1_vault_requests");
      if (raw) {
        setRequests(JSON.parse(raw));
      }
    } catch {
      setRequests([]);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    updatePaymentSettings({ upiId: upiId.trim(), displayName: displayName.trim() });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleGenerateVoucher = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let token = "";
    for (let i = 0; i < 4; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const code = `W1-${voucherAmount}-${token}`;
    setGeneratedCode(code);
    setCopiedCode(false);
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleResolve = (r: LocalRequest, status: "approved" | "rejected") => {
    const updated = requests.map((item) =>
      item.id === r.id ? { ...item, status } : item
    );
    setRequests(updated);
    localStorage.setItem("win1_vault_requests", JSON.stringify(updated));

    settleRequest({
      id: r.id,
      kind: r.kind,
      status,
      amount: r.amount,
      userKey: r.phone,
    });

    if (status === "approved") {
      toast.success(`${r.kind.toUpperCase()} of ₹${r.amount} approved for +91 ${r.phone}!`);
    } else {
      toast.error(`${r.kind.toUpperCase()} rejected.`);
    }
  };

  const pendingDeposits = requests.filter((r) => r.kind === "deposit" && r.status === "pending");
  const pendingWithdrawals = requests.filter((r) => r.kind === "withdrawal" && r.status === "pending");

  return (
    <div className="max-w-md mx-auto space-y-5 p-2">
      <div className="flex items-center gap-2 border-b border-primary/30 pb-3">
        <ShieldCheck className="size-6 text-primary" />
        <h2 className="font-display text-xl font-bold neon-text">Admin Operator Console</h2>
      </div>

      {/* 1. Instant Voucher Generator */}
      <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="size-5 text-emerald-400" />
            <h3 className="font-display font-bold text-foreground text-sm">Credit Voucher Generator</h3>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
            ONE-TIME USE
          </span>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Select Amount (₹)</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {PRESET_AMOUNTS.map((amt) => (
              <Button
                key={amt}
                type="button"
                size="sm"
                variant={voucherAmount === amt ? "default" : "outline"}
                onClick={() => setVoucherAmount(amt)}
                className="font-display font-semibold text-xs"
              >
                ₹{amt}
              </Button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGenerateVoucher}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold tracking-wider uppercase text-xs py-4 flex items-center justify-center gap-2"
        >
          <RefreshCw className="size-4" /> Generate ₹{voucherAmount} Code
        </Button>

        {generatedCode && (
          <div className="p-3 bg-background/80 rounded-lg border border-emerald-500/40 space-y-2 text-center">
            <p className="text-[11px] text-muted-foreground font-bold">VOUCHER CODE FOR USER:</p>
            <div className="flex items-center justify-between bg-secondary/80 px-3 py-2 rounded font-mono text-base font-bold text-emerald-400">
              <span className="tracking-widest">{generatedCode}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleCopyCode}
                className="h-7 px-2 text-xs flex items-center gap-1"
              >
                {copiedCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                {copiedCode ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Real Deposit Requests Queue */}
      <div className="p-4 rounded-xl border border-primary/40 bg-secondary/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-primary" />
            <h3 className="font-display font-bold text-foreground text-sm">Deposit Verification</h3>
          </div>
          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-mono font-bold">
            {pendingDeposits.length} WAITING
          </span>
        </div>

        {pendingDeposits.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-4 text-muted-foreground">
            <Inbox className="size-5 opacity-50" />
            <p className="text-xs">No pending deposits right now.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingDeposits.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-background/80 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground font-mono">
                    <Phone className="size-3 text-primary" /> +91 {r.phone}
                  </div>
                  <span className="font-display font-bold text-emerald-400 text-sm">₹{r.amount}</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">UTR: {r.utr || "N/A"}</p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => handleResolve(r, "approved")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] h-8"
                  >
                    <BadgeCheck className="size-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleResolve(r, "rejected")}
                    className="text-[11px] h-8"
                  >
                    <XCircle className="size-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Real Withdrawal Requests Queue */}
      <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpFromLine className="size-4 text-rose-400" />
            <h3 className="font-display font-bold text-foreground text-sm">Withdrawal Payouts</h3>
          </div>
          <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-mono font-bold">
            {pendingWithdrawals.length} WAITING
          </span>
        </div>

        {pendingWithdrawals.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-4 text-muted-foreground">
            <Inbox className="size-5 opacity-50" />
            <p className="text-xs">No pending withdrawals.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingWithdrawals.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-background/80 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground font-mono">
                    <Phone className="size-3 text-rose-400" /> +91 {r.phone}
                  </div>
                  <span className="font-display font-bold text-rose-400 text-sm">₹{r.amount}</span>
                </div>
                <p className="text-[11px] text-foreground font-mono bg-secondary/60 p-1.5 rounded">
                  Send to UPI: <strong>{r.destination}</strong>
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={() => handleResolve(r, "approved")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] h-8"
                  >
                    <BadgeCheck className="size-3.5 mr-1" /> Sent (Approve)
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleResolve(r, "rejected")}
                    className="text-[11px] h-8"
                  >
                    <XCircle className="size-3.5 mr-1" /> Refund (Reject)
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. UPI Receiver Settings */}
      <form onSubmit={handleSavePayment} className="p-4 rounded-xl border border-border bg-secondary/30 space-y-3">
        <div className="flex items-center gap-2">
          <QrCode className="size-4 text-primary" />
          <h3 className="font-display font-bold text-foreground text-sm">UPI Payment Receiver Setup</h3>
        </div>

        <div className="space-y-1">
          <Label htmlFor="admin-upi" className="text-xs text-muted-foreground">
            Admin Receiving UPI ID
          </Label>
          <Input
            id="admin-upi"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="font-mono text-xs"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="admin-name" className="text-xs text-muted-foreground">
            Merchant / Receiver Name
          </Label>
          <Input
            id="admin-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="font-display text-xs"
            required
          />
        </div>

        <Button type="submit" className="w-full font-display font-bold tracking-wider uppercase text-xs py-4">
          {saveSuccess ? "Settings Saved!" : "Save Payment Settings"}
        </Button>
      </form>
    </div>
  );
}
