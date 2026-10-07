-- Security hardening for signup roles, profile updates, enquiries, and property queries.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.user_role := 'user';
BEGIN
  IF NEW.raw_user_meta_data->>'role' IN ('user', 'agent') THEN
    v_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, phone_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_role,
    NEW.raw_user_meta_data->>'phone_number'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone_number = EXCLUDED.phone_number,
    updated_at = timezone('utc'::text, now());

  IF v_role = 'agent' THEN
    INSERT INTO public.agent_profiles (profile_id, company_name, license_number, bio)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Independent Agent'),
      NEW.raw_user_meta_data->>'license_number',
      NEW.raw_user_meta_data->>'bio'
    )
    ON CONFLICT (profile_id) DO UPDATE
    SET
      company_name = EXCLUDED.company_name,
      license_number = EXCLUDED.license_number,
      bio = EXCLUDED.bio,
      updated_at = timezone('utc'::text, now());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone_number, avatar_url) ON TABLE public.profiles TO authenticated;

REVOKE UPDATE ON TABLE public.agent_profiles FROM authenticated;
GRANT UPDATE (company_name, license_number, bio) ON TABLE public.agent_profiles TO authenticated;

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'enquiries'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.enquiries', existing_policy.policyname);
  END LOOP;
END
$$;

CREATE POLICY "Anonymous users can insert enquiries"
ON public.enquiries
FOR INSERT
TO anon
WITH CHECK (true);

REVOKE ALL ON TABLE public.enquiries FROM anon, authenticated;
GRANT INSERT ON TABLE public.enquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.enquiries TO service_role;

CREATE INDEX IF NOT EXISTS idx_properties_is_published_created_at
  ON public.properties (is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_district
  ON public.properties (district);
CREATE INDEX IF NOT EXISTS idx_properties_property_type
  ON public.properties (property_type);
CREATE INDEX IF NOT EXISTS idx_properties_purpose
  ON public.properties (purpose);
CREATE INDEX IF NOT EXISTS idx_properties_price
  ON public.properties (price);
CREATE INDEX IF NOT EXISTS idx_properties_user_id
  ON public.properties (user_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_property_id
  ON public.enquiries (property_id);
