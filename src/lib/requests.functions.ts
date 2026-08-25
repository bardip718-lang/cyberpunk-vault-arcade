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

// Resilient Global Shared Store via JSONStorage
const CLOUD_BIN_URL = "https://api.jsonbin.io/v3/b/66cb111ae41b4d34e4238e91";
const GLOBAL_STORE_KEY = "win1_global_requests_store";

// In-Memory fallback
let memoryRequests: VaultRequest[] = [];

export const listRequests = createServerFn({ method: "GET" }).handler(
  async (): Promise<VaultRequest[]> => {
    try {
      const res = await fetch(`https://kv.val.run/${GLOBAL_STORE_KEY}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          memoryRequests = data;
          return data;
        }
      }
    } catch {
      // fallback to memory
    }
    return memoryRequests;
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
      id: "req_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now(),
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

    let list = [...memoryRequests];
    try {
      const res = await fetch(`https://kv.val.run/${GLOBAL_STORE_KEY}`);
      if (res.ok) {
        const fetched = await res.json();
        if (Array.isArray(fetched)) list = fetched;
      }
    } catch {
      // ignore
    }

    list = [newReq, ...list.filter((r) => r.id !== newReq.id)].slice(0, 200);
    memoryRequests = list;

    try {
      await fetch(`https://kv.val.run/${GLOBAL_STORE_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(list),
      });
    } catch {
      // ignore
    }

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

    let list = [...memoryRequests];
    try {
      const res = await fetch(`https://kv.val.run/${GLOBAL_STORE_KEY}`);
      if (res.ok) {
        const fetched = await res.json();
        if (Array.isArray(fetched)) list = fetched;
      }
    } catch {
      // ignore
    }

    let target: VaultRequest | null = null;
    const updated = list.map((r) => {
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
    memoryRequests = updated;

    try {
      await fetch(`https://kv.val.run/${GLOBAL_STORE_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch {
      // ignore
    }

    return target;
  });
        
