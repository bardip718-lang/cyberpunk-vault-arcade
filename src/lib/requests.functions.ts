import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

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

const SELECT_COLUMNS =
  "id, kind, user_key, user_name, user_email, amount, utr, destination, status, created_at, resolved_at";

type Row = {
  id: string;
  kind: string;
  user_key: string;
  user_name: string;
  user_email: string;
  amount: number;
  utr: string;
  destination: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
};

function mapRow(row: Row): VaultRequest {
  return {
    id: row.id,
    kind: row.kind as RequestKind,
    userKey: row.user_key,
    userName: row.user_name,
    userEmail: row.user_email,
    amount: row.amount,
    utr: row.utr,
    destination: row.destination,
    status: row.status as RequestStatus,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listRequests = createServerFn({ method: "GET" }).handler(
  async (): Promise<VaultRequest[]> => {
    const { data, error } = await publicClient()
      .from("transaction_requests")
      .select(SELECT_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => mapRow(r as Row));
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("transaction_requests")
      .insert({
        kind: data.kind,
        user_key: data.userKey,
        user_name: data.userName,
        user_email: data.userEmail,
        amount: data.amount,
        utr: data.utr,
        destination: data.destination,
        status: "pending",
      })
      .select(SELECT_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return mapRow(row as Row);
  });

const resolveSchema = z.object({
  adminEmail: z.string().email(),
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

export const resolveRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => resolveSchema.parse(input))
  .handler(async ({ data }): Promise<VaultRequest> => {
    if (data.adminEmail.trim().toLowerCase() !== ADMIN_EMAIL) {
      throw new Error("Not authorized to resolve requests.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("transaction_requests")
      .update({
        status: data.status,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("status", "pending")
      .select(SELECT_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Request already resolved.");
    const mapped = mapRow(row as Row);
    if (mapped.kind === "deposit" && mapped.status === "approved") {
      const { payReferralBonusIfFirstDeposit } = await import("@/lib/referral-reward.server");
      await payReferralBonusIfFirstDeposit(mapped.userKey);
    }
    return mapped;
  });
