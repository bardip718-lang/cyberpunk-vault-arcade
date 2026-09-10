REVOKE ALL ON public.referrals FROM anon, authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals FORCE ROW LEVEL SECURITY;
COMMENT ON TABLE public.referrals IS 'Contains PII (name, email). No anon/authenticated access: reads and writes go only through trusted server functions using the service role.';