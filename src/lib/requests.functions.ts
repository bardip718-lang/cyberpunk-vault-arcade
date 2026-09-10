import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BUCKET = "deposit-proofs";

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
  /** Storage path of the uploaded payment screenshot (empty when none). */
  screenshotPath: string;
  /** Short-lived signed URL for the screenshot, when available. */
  screenshotUrl: string | null;
};

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
  screenshot_url: string | null;
};

function mapRow(row: Row, signed: string | null): VaultRequest {
  return {
    id: row.id,
    kind: row.kind === "withdrawal" ? "withdrawal" : "deposit",
    userKey: row.user_key,
    userName: row.user_name,
    userEmail: row.user_email ?? "",
    amount: Number(row.amount),
    utr: row.utr ?? "",
    destination: row.destination ?? "",
    status:
      row.status === "approved" ? "approved" : row.status === "rejected" ? "rejected" : "pending",
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    screenshotPath: row.screenshot_url ?? "",
    screenshotUrl: signed,
  };
}

export const listRequests = createServerFn({ method: "GET" }).handler(
  async (): Promise<VaultRequest[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("transaction_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as unknown as Row[];
    const paths = rows.map((r) => r.screenshot_url).filter((p): p is string => !!p);
    const signedMap = new Map<string, string>();
    if (paths.length > 0) {
      const { data: signed } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrls(paths, 60 * 60);
      for (const s of signed ?? []) {
        if (s.path && s.signedUrl) signedMap.set(s.path, s.signedUrl);
      }
    }

    return rows.map((r) => mapRow(r, r.screenshot_url ? (signedMap.get(r.screenshot_url) ?? null) : null));
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
  /** data:image/...;base64,xxxx */
  screenshotDataUrl: z.string().max(7_000_000).default(""),
});

export const submitRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data }): Promise<VaultRequest> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.kind === "withdrawal") {
      const { availableWithdrawable } = await import("@/lib/balance.server");
      const available = await availableWithdrawable(data.userKey);
      if (data.amount > available) {
        throw new Error(
          `Withdrawal exceeds your verified balance. You can withdraw up to ₹${available}.`,
        );
      }
    }

    let screenshotPath = "";
    if (data.screenshotDataUrl.startsWith("data:image/")) {
      const [meta, b64] = data.screenshotDataUrl.split(",");
      if (b64) {
        const contentType = meta?.slice(5).split(";")[0] ?? "image/png";
        const ext = contentType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "png";
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(path, bytes, { contentType, upsert: false });
        if (!upErr) screenshotPath = path;
      }
    }

    const { data: inserted, error } = await supabaseAdmin
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
        screenshot_url: screenshotPath,
      } as never)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    return mapRow(inserted as unknown as Row, null);
  });

const resolveSchema = z.object({
  adminEmail: z.string().min(3),
  id: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
});

export const resolveRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => resolveSchema.parse(input))
  .handler(async ({ data }): Promise<VaultRequest> => {
    if (data.adminEmail.trim().toLowerCase() !== ADMIN_EMAIL) {
      throw new Error("Not authorized to resolve requests.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await supabaseAdmin
      .from("transaction_requests")
      .update({
        status: data.status,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapRow(updated as unknown as Row, null);
  });
