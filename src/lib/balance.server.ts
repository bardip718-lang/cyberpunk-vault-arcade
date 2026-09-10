/**
 * Server-only authoritative wallet maths.
 *
 * The browser wallet (localStorage) is display-only and can be edited by the
 * player, so every withdrawal is validated against balances derived from rows
 * the operator actually approved.
 */
export async function availableWithdrawable(userKey: string): Promise<number> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("transaction_requests")
    .select("kind, amount, status")
    .eq("user_key", userKey)
    .limit(2000);
  if (error) throw new Error(error.message);

  let credited = 0;
  let debited = 0;
  for (const row of (data ?? []) as { kind: string; amount: number; status: string }[]) {
    const amount = Number(row.amount) || 0;
    if (row.kind === "deposit" && row.status === "approved") credited += amount;
    // Pending withdrawals are reserved so a player cannot queue several payouts
    // for the same money.
    if (row.kind === "withdrawal" && (row.status === "approved" || row.status === "pending")) {
      debited += amount;
    }
  }

  return Math.max(0, credited - debited);
}
