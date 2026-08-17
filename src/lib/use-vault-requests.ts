import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { requestsQuery } from "@/lib/requests-query";
import { useVault } from "@/lib/vault-store";
import type { VaultRequest } from "@/lib/requests.functions";

/** Live list of every deposit/withdrawal request from the shared database. */
export function useVaultRequests() {
  const { data, isLoading } = useQuery(requestsQuery);
  return { requests: (data ?? []) as VaultRequest[], isLoading };
}

/** Keeps the signed-in player's local balance in sync with resolved requests. */
export function useRequestBalanceSync() {
  const { requests } = useVaultRequests();
  const { user, applyResolved } = useVault();

  useEffect(() => {
    if (!user || requests.length === 0) return;
    applyResolved(requests);
  }, [requests, user, applyResolved]);
}
