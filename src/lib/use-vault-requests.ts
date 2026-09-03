import { useState, useEffect } from "react";
import type { VaultRequest, RequestKind, RequestStatus } from "@/lib/requests.functions";

const STORAGE_KEY = "win1_vault_requests_v1";

function loadRequests(): VaultRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as VaultRequest[]) : [];
  } catch {
    return [];
  }
}

export function useVaultRequests() {
  const [requests, setRequests] = useState<VaultRequest[]>(() => loadRequests());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    } catch {
      // ignore
    }
  }, [requests]);

  const createRequest = async (data: {
    kind: RequestKind;
    userKey: string;
    userName: string;
    userEmail: string;
    amount: number;
    utr?: string;
    destination?: string;
  }): Promise<VaultRequest> => {
    const newReq: VaultRequest = {
      id: "req_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      kind: data.kind,
      userKey: data.userKey,
      userName: data.userName,
      userEmail: data.userEmail,
      amount: Number(data.amount),
      utr: data.utr ?? "",
      destination: data.destination ?? "",
      status: "pending",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };

    setRequests((prev) => [newReq, ...prev]);
    return newReq;
  };

  const updateRequestStatus = (id: string, status: RequestStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r)),
    );
  };

  const clearAllRequests = () => {
    setRequests([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  return {
    requests,
    createRequest,
    updateRequestStatus,
    clearAllRequests,
  };
}
