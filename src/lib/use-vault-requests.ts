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
    mutationFn: (input: {
      adminPasscode: string;
      id: string;
      status: Exclude<RequestStatus, "pending">;
    }) =>
      resolveRequest({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REQUESTS_KEY }),
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
