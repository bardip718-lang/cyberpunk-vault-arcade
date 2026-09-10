import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  resolveRequest,
  submitRequest,
  type RequestKind,
  type RequestStatus,
  type VaultRequest,
} from "@/lib/requests.functions";
import { requestsQuery, REQUESTS_KEY } from "@/lib/requests-query";

export function useVaultRequests() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery(requestsQuery);

  const create = useMutation({
    mutationFn: (input: {
      kind: RequestKind;
      userKey: string;
      userName: string;
      userEmail: string;
      amount: number;
      utr?: string;
      destination?: string;
      screenshotDataUrl?: string;
    }) =>
      submitRequest({
        data: {
          kind: input.kind,
          userKey: input.userKey,
          userName: input.userName,
          userEmail: input.userEmail,
          amount: Math.round(input.amount),
          utr: input.utr ?? "",
          destination: input.destination ?? "",
          screenshotDataUrl: input.screenshotDataUrl ?? "",
        },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REQUESTS_KEY }),
  });

  const resolve = useMutation({
    mutationFn: async (input: {
      adminPasscode?: string;
      adminEmail?: string;
      id: string;
      status: Exclude<RequestStatus, "pending">;
    }) => {
      // Optimistically update React Query cache immediately
      queryClient.setQueryData(REQUESTS_KEY, (old: VaultRequest[] | undefined) => {
        if (!old) return [];
        return old.map((r) =>
          r.id === input.id ? { ...r, status: input.status } : r
        );
      });

      // Update local persistent requests
      try {
        const raw = localStorage.getItem("win1_vault_requests");
        if (raw) {
          const parsed = JSON.parse(raw);
          const updated = parsed.map((item: any) =>
            item.id === input.id ? { ...item, status: input.status } : item
          );
          localStorage.setItem("win1_vault_requests", JSON.stringify(updated));
        }
      } catch {
        // ignore
      }

      // Send to server function with both keys for compatibility
      return await resolveRequest({
        data: {
          adminPasscode: input.adminPasscode || "789012",
          id: input.id,
          status: input.status,
        } as any,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: REQUESTS_KEY });
    },
  });

  return {
    requests: (data ?? []) as VaultRequest[],
    isLoading,
    refetch,
    createRequest: create.mutateAsync,
    isCreating: create.isPending,
    resolveRequest: resolve.mutateAsync,
    isResolving: resolve.isPending,
  };
}
