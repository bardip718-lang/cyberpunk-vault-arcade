-- 1. Referrals: stop public scraping of names/emails/codes.
DROP POLICY IF EXISTS "Referrals are publicly readable" ON public.referrals;
REVOKE SELECT ON public.referrals FROM anon;
REVOKE SELECT ON public.referrals FROM authenticated;
GRANT ALL ON public.referrals TO service_role;

-- 2. Deposit proof screenshots: explicit deny-by-default rules on storage objects.
DROP POLICY IF EXISTS "deposit-proofs are operator only (select)" ON storage.objects;
CREATE POLICY "deposit-proofs are operator only (select)"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id <> 'deposit-proofs' AND false);

DROP POLICY IF EXISTS "deposit-proofs are operator only (insert)" ON storage.objects;
CREATE POLICY "deposit-proofs are operator only (insert)"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id <> 'deposit-proofs' AND false);

DROP POLICY IF EXISTS "deposit-proofs are operator only (update)" ON storage.objects;
CREATE POLICY "deposit-proofs are operator only (update)"
ON storage.objects FOR UPDATE TO anon, authenticated
USING (bucket_id <> 'deposit-proofs' AND false)
WITH CHECK (bucket_id <> 'deposit-proofs' AND false);

DROP POLICY IF EXISTS "deposit-proofs are operator only (delete)" ON storage.objects;
CREATE POLICY "deposit-proofs are operator only (delete)"
ON storage.objects FOR DELETE TO anon, authenticated
USING (bucket_id <> 'deposit-proofs' AND false);