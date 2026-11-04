CREATE TABLE public.user_roles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL CHECK (role = 'owner'),
 UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own owner assignment" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
COMMENT ON TABLE public.user_roles IS 'Owner portal access. Assign only after independently verifying the operator auth account; no self-assignment.';