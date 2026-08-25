import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_EMAIL = "bardip718@gmail.com";

export type RequestKind = "deposit" | "withdrawal";
export type RequestStatus = "pending" | "approved" | "rejected";

export type VaultRequest = {
  id: string;
  kind: RequestKind;
  userKey: string;
  userName: string;
  userEmail: string;
  amount: number;
  utr: string;
  destination: string;
  status: RequestStatus;
  createdAt: string;
  resolvedAt: string | null;
};

const STORAGE_KEY = "win1_vault_persistent_requests_v2";

function getStoredRequests(): VaultRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredRequests(list: VaultRequest[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export const listRequests = createServerFn({ method: "GET" }).handler(
  async (): Promise<VaultRequest[]> => {
    return getStoredRequests();
  },
);

const submitSchema = z.object({
  kind: z.enum(["deposit", "withdrawal"]),
  userKey: z.string().min(1).max(120),
  userName: z.string().min(1).max(120),
  userEmail: z.string().max(160).default(""),
  amount: z.number().int().min(1).max(1_000_000),
  utr: z.string().max(40).default(""),
  destination: z.string().max(300).default(""),
});

export const submitRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data }): Promise<VaultRequest> => {
    const newReq: VaultRequest = {
      id: "req_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      kind: data.kind,
      userKey: data.userKey,
      userName: data.userName,
      userEmail: data.userEmail,
      amount: data.amount,
      utr: data.utr,
      destination: data.destination,
      status: "pending",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };

    const current = getStoredRequests();
    const updated = [newReq, ...current].slice(0, 100);
    saveStoredRequests(updated);

    return newReq;
  });

const resolveSchema = z.object({
  adminEmail: z.string().email(),
  id: z.string(),
  status: z.enum(["approved", "rejected"]),
});

export const resolveRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => resolveSchema.parse(input))
  .handler(async ({ data }): Promise<VaultRequest> => {
    if (data.adminEmail.trim().toLowerCase() !== ADMIN_EMAIL) {
      throw new Error("Not authorized to resolve requests.");
    }

    const current = getStoredRequests();
    let target: VaultRequest | null = null;

    const updated = current.map((r) => {
      if (r.id === data.id) {
        target = {
          ...r,
          status: data.status,
          resolvedAt: new Date().toISOString(),
        };
        return target;
      }
      return r;
    });

    if (!target) throw new Error("Request not found");
    saveStoredRequests(updated);

    return target;
  });
    
