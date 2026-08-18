import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useVault } from "@/lib/vault-store";
import { ensureReferralProfile, type ReferralProfile } from "@/lib/referral.functions";

export const referralKey = (userKey: string) => ["referral", userKey] as const;

/** Live referral profile (code, invited count, bonus earned) for the signed-in player. */
export function useReferral() {
  const { user } = useVault();
  const enabled = !!user && !user.guest;
  const query = useQuery<ReferralProfile | null>({
    queryKey: referralKey(user?.id ?? "anon"),
    enabled,
    refetchInterval: 8_000,
    queryFn: () =>
      ensureReferralProfile({
        data: { userKey: user!.id, userName: user!.name, userEmail: user!.email },
      }),
  });
  return { profile: query.data ?? null, isLoading: query.isLoading, enabled };
}

/** Credits any newly earned referral bonus into the local balance and notifies the player. */
export function useReferralBonusSync() {
  const { profile } = useReferral();
  const { applyReferralBonus, user } = useVault();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!profile || !user) return;
    const credited = applyReferralBonus(profile.bonusEarned);
    if (credited > 0) {
      toast.success(`Your friend deposited! You received a Referral Bonus of ${credited} credits! 🎁`);
      queryClient.invalidateQueries({ queryKey: referralKey(user.id) });
    }
  }, [profile, user, applyReferralBonus, queryClient]);
}
