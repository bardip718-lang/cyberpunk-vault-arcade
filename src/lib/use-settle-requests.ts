import { useEffect } from "react";
import { useVault } from "@/lib/vault-store";
import { useVaultRequests } from "@/lib/use-vault-requests";

/**
 * Watches the signed-in player's requests and applies operator decisions to
 * their wallet exactly once (approved deposits credit real cash, rejected
 * withdrawals are refunded).
 */
export function useSettleOwnRequests() {
  const { user, settleRequest } = useVault();
  const { requests } = useVaultRequests();

  useEffect(() => {
    if (user.guest) return;
    for (const r of requests) {
      if (r.userKey !== user.id) continue;
      if (r.status === "pending") continue;
      settleRequest({ id: r.id, kind: r.kind, status: r.status, amount: r.amount });
    }
  }, [requests, user.guest, user.id, settleRequest]);
}
