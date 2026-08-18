CREATE TABLE public.referrals (
  user_key text PRIMARY KEY,
  user_name text NOT NULL DEFAULT '',
  user_email text NOT NULL DEFAULT '',
  code text NOT NULL UNIQUE,
  referred_by_code text,
  reward_paid boolean NOT NULL DEFAULT false,
  bonus_earned integer NOT NULL DEFAULT 0,
  invited_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.referrals TO anon;
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrals are publicly readable"
  ON public.referrals FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX referrals_referred_by_code_idx ON public.referrals (referred_by_code);

ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS referral_bonus integer NOT NULL DEFAULT 50;