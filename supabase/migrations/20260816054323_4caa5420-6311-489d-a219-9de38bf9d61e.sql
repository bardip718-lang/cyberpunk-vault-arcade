CREATE TABLE public.payment_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  upi_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  qr_code_url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_settings TO anon;
GRANT SELECT ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payment settings are publicly readable"
ON public.payment_settings FOR SELECT
TO anon, authenticated
USING (true);

INSERT INTO public.payment_settings (id, upi_id, display_name, qr_code_url)
VALUES ('default', '7719254845@ybl', 'WIN1 VAULT', '');
