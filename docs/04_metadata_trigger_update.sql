-- Update the handle_new_user function to extract profile information from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'user';
BEGIN
  -- Determine role from metadata if specified, otherwise default to 'user'
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    v_role := (NEW.raw_user_meta_data->>'role')::user_role;
  END IF;

  -- 1. Insert into public.profiles
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

  -- 2. If the user is an agent, insert/update agent_profiles
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
