import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type RequestKind,
  type RequestStatus,
  type VaultRequest,
} from "@/lib/requests.functions";
import { REQUESTS_KEY } from "@/lib/requests-query";

const LOCAL_STORAGE_KEY = "win1_vault_requests_db";

function getStoredRequests(): VaultRequest[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function saveStoredRequests(list: VaultRequest[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function useVaultRequests() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: REQUESTS_KEY,
    queryFn: () => getStoredRequests(),
    initialData: () => getStoredRequests(),
  });

  const create = useMutation({
    mutationFn: async (input: {
      kind: RequestKind;
      userKey: string;
      userName: string;
      userEmail: string;
      amount: number;
      utr?: string;
      destination?: string;
      screenshotDataUrl?: string;
    }) => {
      const current = getStoredRequests();
      const newReq: VaultRequest = {
        id: "req_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        kind: input.kind,
        userKey: input.userKey,
        userName: input.userName,
        userEmail: input.userEmail,
        amount: Math.round(input.amount),
        utr: input.utr ?? "",
        destination: input.destination ?? "",
        screenshotDataUrl: input.screenshotDataUrl ?? "",
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      const updated = [newReq, ...current];
      saveStoredRequests(updated);
      return newReq;
    },
    onSuccess: (newReq) => {
      queryClient.setQueryData(REQUESTS_KEY, (old: VaultRequest[] | undefined) => [
        newReq,
        ...(old || []),
      ]);
    },
  });

  const resolve = useMutation({
    mutationFn: async (input: {
      adminPasscode?: string;
      adminEmail?: string;
      id: string;
      status: Exclude<RequestStatus, "pending">;
    }) => {
      const current = getStoredRequests();
      const updated = current.map((r) =>
        r.id === input.id ? { ...r, status: input.status } : r
      );
      saveStoredRequests(updated);
      return { id: input.id, status: input.status };
    },
    onSuccess: ({ id, status }) => {
      queryClient.setQueryData(REQUESTS_KEY, (old: VaultRequest[] | undefined) => {
        if (!old) return [];
        return old.map((r) => (r.id === id ? { ...r, status } : r));
      });
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
