/** Server-only helper: pays the referral bonus on a player's first approved deposit. */
export async function payReferralBonusIfFirstDeposit(userKey: string): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { count } = await supabaseAdmin
    .from("transaction_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_key", userKey)
    .eq("kind", "deposit")
    .eq("status", "approved");
  if ((count ?? 0) !== 1) return 0;

  const { data: profile } = await supabaseAdmin
    .from("referrals")
    .select("user_key, referred_by_code, reward_paid")
    .eq("user_key", userKey)
    .maybeSingle();
  if (!profile || !profile.referred_by_code || profile.reward_paid) return 0;

  const { data: settings } = await supabaseAdmin
    .from("payment_settings")
    .select("referral_bonus")
    .eq("id", "default")
    .maybeSingle();
  const bonus = settings?.referral_bonus ?? 50;
  if (bonus <= 0) return 0;

  const { data: referrer } = await supabaseAdmin
    .from("referrals")
    .select("user_key, bonus_earned")
    .eq("code", profile.referred_by_code)
    .maybeSingle();
  if (!referrer) return 0;

  const { error } = await supabaseAdmin
    .from("referrals")
    .update({ bonus_earned: referrer.bonus_earned + bonus, updated_at: new Date().toISOString() })
    .eq("user_key", referrer.user_key);
  if (error) return 0;

  await supabaseAdmin
    .from("referrals")
    .update({ reward_paid: true, updated_at: new Date().toISOString() })
    .eq("user_key", userKey);

  return bonus;
}
