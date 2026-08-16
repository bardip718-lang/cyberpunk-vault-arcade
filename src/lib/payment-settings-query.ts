import { queryOptions } from "@tanstack/react-query";
import { getPaymentSettings, type PaymentSettingsRow } from "@/lib/payment-settings.functions";
import depositQrAsset from "@/assets/deposit-qr.png.asset.json";

export const PAYMENT_SETTINGS_KEY = ["payment-settings"] as const;

/** Image used only when the operator has not saved a QR image URL yet. */
export const FALLBACK_QR = depositQrAsset.url;

export const paymentSettingsQuery = queryOptions<PaymentSettingsRow | null>({
  queryKey: PAYMENT_SETTINGS_KEY,
  queryFn: () => getPaymentSettings(),
  staleTime: 10_000,
  refetchOnWindowFocus: true,
});
