import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type ReferralProfile = {
  userKey: string;
  userName: string;
  code: string;
  referredByCode: string | null;
  rewardPaid: boolean;
  bonusEarned: number;
  invitedCount: number;
};

const SELECT_COLUMNS =
  "user_key, user_name, code, referred_by_code, reward_paid, bonus_earned, invited_count";

type Row = {
  user_key: string;
  user_name: string;
  code: string;
  referred_by_code: string | null;
  reward_paid: boolean;
  bonus_earned: number;
  invited_count: number;
};

function mapRow(row: Row): ReferralProfile {
  return {
    userKey: row.user_key,
    userName: row.user_name,
    code: row.code,
    referredByCode: row.referred_by_code,
    rewardPaid: row.reward_paid,
    bonusEarned: row.bonus_earned,
    invitedCount: row.invited_count,
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

function makeCode(seed: string) {
  const clean = seed.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4) || "WIN1";
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${clean}${rand}`;
}

const ensureSchema = z.object({
  userKey: z.string().min(1).max(120),
  userName: z.string().max(120).default(""),
  userEmail: z.string().max(160).default(""),
  referredByCode: z.string().max(20).optional().nullable(),
});

/** Fetches (or lazily creates) the referral profile for a player. */
export const ensureReferralProfile = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ensureSchema.parse(input))
  .handler(async ({ data }): Promise<ReferralProfile> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("referrals")
      .select(SELECT_COLUMNS)
      .eq("user_key", data.userKey)
      .maybeSingle();

    if (existing) {
      const counted = await supabaseAdmin
        .from("referrals")
        .select("user_key", { count: "exact", head: true })
        .eq("referred_by_code", existing.code);
      return mapRow({ ...(existing as Row), invited_count: counted.count ?? 0 });
    }

    let referrer: string | null = null;
    const wanted = (data.referredByCode ?? "").trim().toUpperCase();
    if (wanted) {
      const { data: owner } = await supabaseAdmin
        .from("referrals")
        .select("code, user_key")
        .eq("code", wanted)
        .maybeSingle();
      if (owner && owner.user_key !== data.userKey) referrer = owner.code;
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data: row, error } = await supabaseAdmin
        .from("referrals")
        .insert({
          user_key: data.userKey,
          user_name: data.userName,
          user_email: data.userEmail,
          code: makeCode(data.userName || data.userKey),
          referred_by_code: referrer,
        })
        .select(SELECT_COLUMNS)
        .single();
      if (!error && row) return mapRow(row as Row);
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    }
    throw new Error("Could not create a referral code. Try again.");
  });

const getSchema = z.object({ userKey: z.string().min(1).max(120) });

export const getReferralProfile = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => getSchema.parse(input))
  .handler(async ({ data }): Promise<ReferralProfile | null> => {
    const supabase = publicClient();
    const { data: row, error } = await supabase
      .from("referrals")
      .select(SELECT_COLUMNS)
      .eq("user_key", data.userKey)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const counted = await supabase
      .from("referrals")
      .select("user_key", { count: "exact", head: true })
      .eq("referred_by_code", (row as Row).code);
    return mapRow({ ...(row as Row), invited_count: counted.count ?? 0 });
  });
