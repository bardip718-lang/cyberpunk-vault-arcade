import { queryOptions } from "@tanstack/react-query";
import { listRequests, type VaultRequest } from "@/lib/requests.functions";

export const REQUESTS_KEY = ["transaction-requests"] as const;

export const requestsQuery = queryOptions<VaultRequest[]>({
  queryKey: REQUESTS_KEY,
  queryFn: () => listRequests(),
  refetchInterval: 5_000,
  refetchOnWindowFocus: true,
  staleTime: 2_000,
});
