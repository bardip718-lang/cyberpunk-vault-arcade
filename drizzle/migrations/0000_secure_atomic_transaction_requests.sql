DROP POLICY IF EXISTS "Transaction requests are publicly readable" ON public.transaction_requests;
REVOKE ALL ON public.transaction_requests FROM anon, authenticated;
GRANT ALL ON public.transaction_requests TO service_role;
ALTER TABLE public.transaction_requests ADD COLUMN IF NOT EXISTS owner_id uuid;
ALTER TABLE public.transaction_requests ADD COLUMN IF NOT EXISTS request_key uuid;
CREATE UNIQUE INDEX IF NOT EXISTS transaction_requests_request_key_idx ON public.transaction_requests(request_key) WHERE request_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS transaction_requests_owner_idx ON public.transaction_requests(owner_id, created_at DESC);
CREATE OR REPLACE FUNCTION public.submit_vault_request(p_owner uuid, p_key text, p_name text, p_email text, p_kind text, p_amount integer, p_utr text, p_destination text, p_screenshot text, p_request_key uuid) RETURNS public.transaction_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE found public.transaction_requests; available bigint;
BEGIN
 IF p_owner IS NULL OR p_request_key IS NULL THEN RAISE EXCEPTION 'Verified account required'; END IF;
 IF p_kind NOT IN ('deposit','withdrawal') OR p_amount < 100 OR p_amount > 1000000 THEN RAISE EXCEPTION 'Invalid request amount'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_key,0));
 SELECT * INTO found FROM public.transaction_requests WHERE request_key=p_request_key;
 IF FOUND THEN IF found.owner_id IS DISTINCT FROM p_owner THEN RAISE EXCEPTION 'Request not available'; END IF; RETURN found; END IF;
 IF p_kind='deposit' THEN
  IF p_utr !~ '^[0-9]{12}$' OR coalesce(p_screenshot,'')='' THEN RAISE EXCEPTION 'A 12-digit UTR and payment screenshot are required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_utr,1));
  IF EXISTS(SELECT 1 FROM public.transaction_requests WHERE kind='deposit' AND utr=p_utr AND status<>'rejected') THEN RAISE EXCEPTION 'This UTR has already been submitted'; END IF;
 ELSE
  IF length(trim(p_destination))<6 THEN RAISE EXCEPTION 'Payout details required'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.transaction_requests WHERE user_key=p_key AND kind='deposit' AND status='approved' AND amount>=100) THEN RAISE EXCEPTION 'One approved deposit of at least 100 is required'; END IF;
  SELECT coalesce(sum(CASE WHEN kind='deposit' AND status='approved' THEN amount WHEN kind='withdrawal' AND status IN ('pending','approved') THEN -amount ELSE 0 END),0) INTO available FROM public.transaction_requests WHERE user_key=p_key;
  IF p_amount>available THEN RAISE EXCEPTION 'Withdrawal exceeds verified available funds'; END IF;
 END IF;
 INSERT INTO public.transaction_requests(owner_id,request_key,user_key,user_name,user_email,kind,amount,utr,destination,screenshot_url) VALUES(p_owner,p_request_key,p_key,p_name,p_email,p_kind,p_amount,p_utr,p_destination,p_screenshot) RETURNING * INTO found;
 RETURN found;
END $$;
REVOKE ALL ON FUNCTION public.submit_vault_request(uuid,text,text,text,text,integer,text,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_vault_request(uuid,text,text,text,text,integer,text,text,text,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.resolve_vault_request(p_id uuid,p_status text) RETURNS public.transaction_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE found public.transaction_requests;
BEGIN
 IF p_status NOT IN ('approved','rejected') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 SELECT * INTO found FROM public.transaction_requests WHERE id=p_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(found.user_key,0));
 SELECT * INTO found FROM public.transaction_requests WHERE id=p_id FOR UPDATE;
 IF found.status=p_status THEN RETURN found; END IF;
 IF found.status<>'pending' THEN RAISE EXCEPTION 'This request is already resolved'; END IF;
 UPDATE public.transaction_requests SET status=p_status,resolved_at=now(),updated_at=now() WHERE id=p_id RETURNING * INTO found;
 RETURN found;
END $$;
REVOKE ALL ON FUNCTION public.resolve_vault_request(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_vault_request(uuid,text) TO service_role;