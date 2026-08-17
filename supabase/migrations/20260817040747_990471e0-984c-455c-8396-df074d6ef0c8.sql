CREATE TABLE public.transaction_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('deposit','withdrawal')),
  user_key text NOT NULL,
  user_name text NOT NULL,
  user_email text NOT NULL DEFAULT '',
  amount integer NOT NULL CHECK (amount > 0),
  utr text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

GRANT SELECT ON public.transaction_requests TO anon;
GRANT SELECT ON public.transaction_requests TO authenticated;
GRANT ALL ON public.transaction_requests TO service_role;

ALTER TABLE public.transaction_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transaction requests are publicly readable"
ON public.transaction_requests FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX transaction_requests_status_idx ON public.transaction_requests (status, created_at DESC);