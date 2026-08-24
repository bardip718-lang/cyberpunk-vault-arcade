import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVault } from "@/lib/vault-store";
import { useVaultRequests, VaultRequest } from "@/lib/use-vault-requests";
import { Check, X, ShieldCheck, RefreshCw, Smartphone, QrCode } from "lucide-react";

export function AdminConsole() {
  const { config, setConfig, updateBalance } = useVault();
  const { requests, updateRequestStatus, clearAllRequests } = useVaultRequests();

  const [upiId, setUpiId] = useState(config?.upiId || "8317848513@ybl");
  const [upiName, setUpiName] = useState(config?.upiName || "WIN1 VAULT");
  const [savedMsg, setSavedMsg] = useState(false);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const historyRequests = requests.filter((r) => r.status !== "pending").slice(0, 10);

  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof setConfig === "function") {
      setConfig({
        upiId: upiId.trim(),
        upiName: upiName.trim(),
      });
    }
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const handleApprove = async (req: VaultRequest) => {
    // 1. Status Approved karo
    if (typeof updateRequestStatus === "function") {
      updateRequestStatus(req.id, "approved");
    }

    // 2. Direct score balance credit karo
    if (req.type === "topup" && typeof updateBalance === "function") {
      updateBalance(Number(req.amount));
    }

    alert(`✅ Deposit of ₹${req.amount} approved! Balance credited instantly.`);
  };

  const handleReject = async (req: VaultRequest) => {
    if (typeof updateRequestStatus === "function") {
      updateRequestStatus(req.id, "rejected");
    }

    // Agar withdrawal reject hua toh amount wapas user wallet me refund karo
    if (req.type === "withdraw" && typeof updateBalance === "function") {
      updateBalance(Number(req.amount));
    }

    alert(`❌ Request of ₹${req.amount} marked as rejected.`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Payment Gateway Settings */}
      <div className="rounded-xl border border-border bg-background/50 p-4">
        <h3 className="font-display text-lg text-primary flex items-center gap-2 mb-3">
          <QrCode className="size-4" /> UPI Payment Receiver Setup
        </h3>
        <form onSubmit={handleSavePaymentSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Admin Receiving UPI ID</Label>
            <Input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. yourname@upi"
              className="font-display"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Merchant / Receiver Name</Label>
            <Input
              value={upiName}
              onChange={(e) => setUpiName(e.target.value)}
              placeholder="e.g. WIN1 VAULT"
              className="font-display"
              required
            />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between mt-2">
            <Button type="submit" size="sm" className="font-display font-bold">
              Save Payment Settings
            </Button>
            {savedMsg && <span className="text-xs text-emerald-400 font-bold">Saved successfully!</span>}
          </div>
        </form>
      </div>

      {/* 2. Pending Requests */}
      <div className="rounded-xl border border-border bg-background/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-foreground flex items-center gap-2">
            <Smartphone className="size-4 text-primary" /> Pending User Requests ({pendingRequests.length})
          </h3>
          {requests.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (window.confirm("Clear all logs?")) clearAllRequests?.();
              }}
              className="text-xs text-muted-foreground"
            >
              Clear Logs
            </Button>
          )}
        </div>

        {pendingRequests.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No pending deposit or withdrawal requests.</p>
        ) : (
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-border bg-secondary/40"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        req.type === "topup" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {req.type === "topup" ? "DEPOSIT" : "WITHDRAW"}
                    </span>
                    <span className="font-display font-bold text-foreground">₹{req.amount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    User: <span className="text-foreground font-mono">{req.userEmail || "Guest"}</span>
                  </p>
                  {req.utr && (
                    <p className="text-xs text-muted-foreground">
                      UTR / Ref: <span className="font-mono text-primary font-bold">{req.utr}</span>
                    </p>
                  )}
                  {req.upiId && (
                    <p className="text-xs text-muted-foreground">
                      Pay to UPI: <span className="font-mono text-cyan-400 font-bold">{req.upiId}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(req)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs"
                  >
                    <Check className="size-3.5 mr-1" /> Approve &amp; Credit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(req)}
                    className="border-rose-500/40 text-rose-400 hover:bg-rose-500/20 text-xs font-display"
                  >
                    <X className="size-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. History */}
      {historyRequests.length > 0 && (
        <div className="rounded-xl border border-border bg-background/30 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Recent Completed Actions</h4>
          <div className="space-y-1.5">
            {historyRequests.map((h) => (
              <div key={h.id} className="flex items-center justify-between text-xs py-1 border-b border-border/40">
                <span className="font-mono">{h.userEmail} · ₹{h.amount}</span>
                <span className={`font-bold uppercase ${h.status === "approved" ? "text-emerald-400" : "text-rose-400"}`}>
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

      
            
