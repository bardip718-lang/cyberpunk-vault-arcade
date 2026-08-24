import { useState, useEffect } from "react";

export interface VaultRequest {
  id: string;
  type: "topup" | "withdraw";
  amount: number;
  utr?: string;
  upiId?: string;
  userEmail?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const STORAGE_KEY = "win1_vault_requests_v1";

export function useVaultRequests() {
  const [requests, setRequests] = useState<VaultRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    } catch {
      // ignore
    }
  }, [requests]);

  const createRequest = async (data: {
    type: "topup" | "withdraw";
    amount: number;
    utr?: string;
    upiId?: string;
    userEmail?: string;
  }) => {
    const newReq: VaultRequest = {
      id: "req_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      type: data.type,
      amount: Number(data.amount),
      utr: data.utr,
      upiId: data.upiId,
      userEmail: data.userEmail || "Guest Player",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setRequests((prev) => [newReq, ...prev]);
    return newReq;
  };

  const updateRequestStatus = (id: string, status: "approved" | "rejected") => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  const clearAllRequests = () => {
    setRequests([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    requests,
    createRequest,
    updateRequestStatus,
    clearAllRequests,
  };
}
