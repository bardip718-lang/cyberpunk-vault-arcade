import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type PaymentSettingsRow = {
  upiId: string;
  displayName: string;
  qrUrl: string;
  updatedAt: string;
};

const ADMIN_EMAIL = "bardip718@gmail.com";

export const getPaymentSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<PaymentSettingsRow | null> => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabasePublic = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
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

    const { data, error } = await supabasePublic
      .from("payment_settings")
      .select("upi_id, display_name, qr_code_url, updated_at")
      .eq("id", "default")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      upiId: data.upi_id,
      displayName: data.display_name,
      qrUrl: data.qr_code_url,
      updatedAt: data.updated_at,
    };
  },
);

const saveSchema = z.object({
  adminEmail: z.string().email(),
  upiId: z.string().min(5).max(100),
  displayName: z.string().min(1).max(60),
  qrUrl: z.string().max(500),
});

export const savePaymentSettings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data }): Promise<PaymentSettingsRow> => {
    if (data.adminEmail.trim().toLowerCase() !== ADMIN_EMAIL) {
      throw new Error("Not authorized to change payment settings.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("payment_settings")
      .upsert({
        id: "default",
        upi_id: data.upiId.trim(),
        display_name: data.displayName.trim(),
        qr_code_url: data.qrUrl.trim(),
        updated_at: new Date().toISOString(),
      })
      .select("upi_id, display_name, qr_code_url, updated_at")
      .single();

    if (error) throw new Error(error.message);
    return {
      upiId: row.upi_id,
      displayName: row.display_name,
      qrUrl: row.qr_code_url,
      updatedAt: row.updated_at,
    };
  });
