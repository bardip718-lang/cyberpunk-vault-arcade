import { useState, useMemo } from "react";
import { useVault } from "@/lib/vault-store";
import { useVaultRequests } from "@/lib/use-vault-requests";
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
  Loader2,
  Search,
  User,
  History,
  TrendingDown,
  TrendingUp,
  Wallet,
  Coins
} from "lucide-react";
import { toast } from "sonner";
import type { VaultRequest } from "@/lib/requests.functions";

const ADMIN_EMAIL = "bardip718@gmail.com";
const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

export function AdminConsole() {
  const { payment, updatePaymentSettings, settleRequest, refundWithdrawal, addScore } = useVault();
  const { requests, isLoading, resolveRequest } = useVaultRequests();

  const [upiId, setUpiId] = useState(payment.upiId);
  const [displayName, setDisplayName] = useState(payment.displayName);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "search" | "vouchers" | "settings">("pending");

  // Voucher Generator State
  const [voucherAmount, setVoucherAmount] = useState<number>(250);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Manual Adjustment State
  const [manualAmount, setManualAmount] = useState("");

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
    } 60
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

  const handleResolve = async (r: VaultRequest, status: "approved" | "rejected") => {
    if (busyId) return;
    setBusyId(r.id);
    try {
      if (typeof resolveRequest === "function") {
        await resolveRequest({ adminEmail: ADMIN_EMAIL, id: r.id, status });
      }

      try {
        const raw = localStorage.getItem("win1_vault_requests");
        if (raw) {
          const list = JSON.parse(raw);
          const updated = list.map((item: any) =>
            item.id === r.id ? { ...item, status } : item
          );
          localStorage.setItem("win1_vault_requests", JSON.stringify(updated));
        }
      } catch {
        // ignore
      }

      if (r.kind === "deposit" && status === "approved") {
        settleRequest({
          id: r.id,
          kind: "deposit",
          status: "approved",
          amount: Number(r.amount),
          userKey: r.userKey || r.userEmail,
        });
      } else if (r.kind === "withdrawal" && status === "rejected") {
        refundWithdrawal(Number(r.amount));
      }

      toast.success(
        status === "approved"
          ? `${r.kind.toUpperCase()} approved successfully!`
          : `${r.kind.toUpperCase()} rejected${r.kind === "withdrawal" ? " & balance refunded" : ""}.`
      );
    } catch {
      if (r.kind === "withdrawal" && status === "rejected") {
        refundWithdrawal(Number(r.amount));
      }
      toast.success(`${r.kind.toUpperCase()} status updated.`);
    } finally {
      setBusyId(null);
    }
  };

  // Filter requests based on search query
  const allRequests = useMemo(() => requests || [], [requests]);

  const searchedRequests = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allRequests.filter((r) => {
      const phone = (r.userKey || r.userEmail || r.userName || "").toLowerCase();
      const utr = (r.utr || "").toLowerCase();
      const id = (r.id || "").toLowerCase();
      return phone.includes(q) || utr.includes(q) || id.includes(q);
    });
  }, [allRequests, searchQuery]);

  // Aggregate user statistics when a specific user query is typed
  const userStats = useMemo(() => {
    if (!searchQuery.trim() || searchedRequests.length === 0) return null;
    const totalDeposits = searchedRequests
      .filter((r) => r.kind === "deposit" && r.status === "approved")
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const totalWithdrawals = searchedRequests
      .filter((r) => r.kind === "withdrawal" && r.status === "approved")
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const pendingCount = searchedRequests.filter((r) => r.status === "pending").length;

    return { totalDeposits, totalWithdrawals, pendingCount };
  }, [searchedRequests, searchQuery]);

  const pendingDeposits = allRequests.filter(
    (r: VaultRequest) => r.kind === "deposit" && r.status === "pending"
  );
  const pendingWithdrawals = allRequests.filter(
    (r: VaultRequest) => r.kind === "withdrawal" && r.status === "pending"
  );

  return (
    <div className="max-w-md mx-auto space-y-4 font-sans select-none text-slate-100">
      
      {/* Console Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-6 text-blue-500" />
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-white">Operator Console</h2>
            <p className="text-[10px] text-slate-400 font-bold">1win Vault Master Engine</p>
          </div>
        </div>
        <span className="text-[10px] bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
          ADMIN ACTIVE
        </span>
      </div>

      {/* Navigation Pills */}
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-[#0e1420] p-1 border border-slate-800 text-[11px] font-bold">
        <button
          onClick={() => setActiveTab("pending")}
          className={`py-1.5 rounded-lg transition-all ${
            activeTab === "pending" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          Queue ({pendingDeposits.length + pendingWithdrawals.length})
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`py-1.5 rounded-lg transition-all ${
            activeTab === "search" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          User Search
        </button>
        <button
          onClick={() => setActiveTab("vouchers")}
          className={`py-1.5 rounded-lg transition-all ${
            activeTab === "vouchers" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          Voucher
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`py-1.5 rounded-lg transition-all ${
            activeTab === "settings" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          Setup
        </button>
      </div>

      {/* TAB 1: User Search & History Inspector */}
      {activeTab === "search" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search User ID, Phone, or UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0e1420] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* User Overview Card */}
          {userStats && (
            <div className="rounded-2xl border border-slate-800 bg-[#111827] p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <User className="size-4 text-blue-400" />
                  <span className="text-xs font-black text-white">{searchQuery}</span>
                </div>
                <span className="text-[10px] font-bold text-amber-400">
                  {userStats.pendingCount} Pending Action(s)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="rounded-xl bg-[#0a0f1d] p-2 border border-emerald-500/20">
                  <span className="text-[9px] font-bold uppercase text-emerald-400 block">Total Deposited</span>
                  <span className="text-sm font-black text-white">₹{userStats.totalDeposits.toLocaleString()}</span>
                </div>
                <div className="rounded-xl bg-[#0a0f1d] p-2 border border-rose-500/20">
                  <span className="text-[9px] font-bold uppercase text-rose-400 block">Total Withdrawn</span>
                  <span className="text-sm font-black text-white">₹{userStats.totalWithdrawals.toLocaleString()}</span>
                </div>
              </div>

              {/* Direct Balance Adjustment Button */}
              <div className="pt-2 border-t border-slate-800/80 flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount ₹"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="h-8 text-xs bg-[#0a0f1d] border-slate-800 text-white"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const amt = Number(manualAmount);
                    if (!amt) return;
                    addScore(amt);
                    toast.success(`Adjusted ₹${amt} to balance!`);
                    setManualAmount("");
                  }}
                  className="h-8 bg-blue-600 hover:bg-blue-500 text-xs font-bold shrink-0"
                >
                  Credit ₹
                </Button>
              </div>
            </div>
          )}

          {/* Searched User List / Transactions */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
              Transaction Records ({searchedRequests.length})
            </h4>

            {searchedRequests.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-[#0e1420] p-6 text-center text-xs text-slate-500">
                {searchQuery ? "No transactions found for this user." : "Type phone or UTR above to search."}
              </div>
            ) : (
              searchedRequests.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-800/80 bg-[#0f1524] p-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {r.kind === "deposit" ? (
                        <TrendingUp className="size-3.5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="size-3.5 text-rose-400" />
                      )}
                      <span className="text-xs font-black uppercase text-white">
                        {r.kind}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-black text-white">
                      ₹{r.amount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>User: {r.userKey || r.userEmail || "Player"}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        r.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : r.status === "rejected"
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  {r.utr && <p className="text-[10px] text-slate-500 font-mono">UTR: {r.utr}</p>}
                  {r.destination && (
                    <p className="text-[10px] text-slate-500 font-mono">To UPI: {r.destination}</p>
                  )}

                  {r.status === "pending" && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => void handleResolve(r, "approved")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] h-7"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busyId === r.id}
                        onClick={() => void handleResolve(r, "rejected")}
                        className="text-[10px] h-7"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Pending Approval Queue */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {/* Pending Deposits */}
          <div className="rounded-2xl border border-slate-800 bg-[#0e1420] p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5">
                <Clock3 className="size-4 text-emerald-400" />
                <h3 className="text-xs font-black uppercase text-white">Deposit Queue</h3>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                {pendingDeposits.length} Pending
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-4 text-xs text-slate-500">
                <Loader2 className="size-4 animate-spin mr-1.5" /> Loading queue...
              </div>
            ) : pendingDeposits.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                No pending deposits right now.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingDeposits.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-800 bg-[#121826] p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-200">
                        <Phone className="size-3 text-blue-400" />
                        <span>{r.userKey || r.userEmail || "Player"}</span>
                      </div>
                      <span className="text-sm font-black text-emerald-400 font-mono">₹{r.amount}</span>
                    </div>
                    <div className="bg-[#0a0e17] px-2 py-1 rounded text-[11px] font-mono text-slate-300 flex justify-between">
                      <span className="text-slate-500">UTR:</span>
                      <span className="font-bold text-amber-300">{r.utr || "Not Provided"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => void handleResolve(r, "approved")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] h-8 font-bold"
                      >
                        {busyId === r.id ? <Loader2 className="size-3 animate-spin mr-1" /> : <BadgeCheck className="size-3.5 mr-1" />}
                        Approve (Credit)
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busyId === r.id}
                        onClick={() => void handleResolve(r, "rejected")}
                        className="text-[11px] h-8 font-bold"
                      >
                        <XCircle className="size-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Withdrawals */}
          <div className="rounded-2xl border border-slate-800 bg-[#0e1420] p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5">
                <ArrowUpFromLine className="size-4 text-rose-400" />
                <h3 className="text-xs font-black uppercase text-white">Withdrawal Queue</h3>
              </div>
              <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">
                {pendingWithdrawals.length} Pending
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-4 text-xs text-slate-500">
                <Loader2 className="size-4 animate-spin mr-1.5" /> Loading queue...
              </div>
            ) : pendingWithdrawals.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                No pending withdrawals right now.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingWithdrawals.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-800 bg-[#121826] p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-200">
                        <Phone className="size-3 text-rose-400" />
                        <span>{r.userKey || r.userEmail || "Player"}</span>
                      </div>
                      <span className="text-sm font-black text-rose-400 font-mono">₹{r.amount}</span>
                    </div>
                    <div className="bg-[#0a0e17] px-2 py-1.5 rounded text-[11px] font-mono text-slate-200">
                      Payout UPI: <strong className="text-emerald-400">{r.destination || "N/A"}</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => void handleResolve(r, "approved")}
                             className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] h-8 font-bold"
                      >
                        {busyId === r.id ? <Loader2 className="size-3 animate-spin mr-1" /> : <BadgeCheck className="size-3.5 mr-1" />}
                        Paid (Approve)
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busyId === r.id}
                        onClick={() => void handleResolve(r, "rejected")}
                        className="text-[11px] h-8 font-bold"
                      >
                        <XCircle className="size-3.5 mr-1" /> Refund (Reject)
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Instant Voucher Codes */}
      {activeTab === "vouchers" && (
        <div className="rounded-2xl border border-slate-800 bg-[#0e1420] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="size-5 text-emerald-400" />
              <h3 className="text-xs font-black uppercase text-white">Voucher Generator</h3>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
              INSTANT CREDIT
            </span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-slate-400 font-bold uppercase">Select Voucher Amount</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setVoucherAmount(amt)}
                  className={`py-1.5 rounded-lg text-xs font-black border transition-all ${
                    voucherAmount === amt
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : "bg-[#121826] border-slate-800 text-slate-300"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGenerateVoucher}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black py-4 uppercase rounded-xl"
          >
            <RefreshCw className="size-3.5 mr-1.5" /> Generate ₹{voucherAmount} Code
          </Button>

          {generatedCode && (
            <div className="rounded-xl border border-emerald-500/40 bg-[#121826] p-3 text-center space-y-2">
              <p className="text-[10px] font-bold uppercase text-slate-400">Share with Player:</p>
              <div className="flex items-center justify-between rounded-lg bg-[#0a0e17] px-3 py-2 font-mono text-sm font-bold text-emerald-400">
                <span className="tracking-widest">{generatedCode}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-xs text-slate-300 hover:text-white"
                >
                  {copiedCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  {copiedCode ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Payment Gateway Receiver Settings */}
      {activeTab === "settings" && (
        <form onSubmit={handleSavePayment} className="rounded-2xl border border-slate-800 bg-[#0e1420] p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <QrCode className="size-4 text-blue-400" />
            <h3 className="text-xs font-black uppercase text-white">Receiver Gateway Setup</h3>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-slate-400 uppercase font-bold">Admin Receiving UPI ID</Label>
            <Input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="h-9 border-slate-800 bg-[#121826] font-mono text-xs text-white"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-slate-400 uppercase font-bold">Merchant Name (Appears on QR)</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-9 border-slate-800 bg-[#121826] text-xs text-white"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-xs font-black uppercase py-4 rounded-xl">
            {saveSuccess ? "Settings Saved!" : "Save Payment Settings"}
          </Button>
        </form>
      )}

    </div>
  );
}

export default AdminConsole;
